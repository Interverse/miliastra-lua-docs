from __future__ import annotations

from pathlib import Path
from typing import Iterable

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    Image,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
TMP = ROOT / "tmp" / "pdfs"
OUTPUT = ROOT / "Docs" / "Miliastra_Client_Script_Handbook_English.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

PAGE_W, PAGE_H = A4
MARGIN_X = 48
MARGIN_TOP = 56
MARGIN_BOTTOM = 48
CONTENT_W = PAGE_W - 2 * MARGIN_X

NAVY = colors.HexColor("#172A3A")
TEAL = colors.HexColor("#0E7C86")
CYAN = colors.HexColor("#DDF4F5")
LIGHT = colors.HexColor("#F4F7F9")
MID = colors.HexColor("#607D8B")
DARK = colors.HexColor("#24343D")
RULE = colors.HexColor("#C8D5DB")
WHITE = colors.white

styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="CoverTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=27,
        leading=32,
        textColor=NAVY,
        alignment=TA_CENTER,
        spaceAfter=16,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=18,
        textColor=MID,
        alignment=TA_CENTER,
        spaceAfter=12,
    )
)
styles.add(
    ParagraphStyle(
        name="Section",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=19,
        leading=23,
        textColor=NAVY,
        spaceBefore=6,
        spaceAfter=10,
        keepWithNext=True,
    )
)
styles.add(
    ParagraphStyle(
        name="Subsection",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13.5,
        leading=17,
        textColor=TEAL,
        spaceBefore=11,
        spaceAfter=6,
        keepWithNext=True,
    )
)
styles.add(
    ParagraphStyle(
        name="Minor",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=DARK,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True,
    )
)
styles.add(
    ParagraphStyle(
        name="BodyText2",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.7,
        leading=14.2,
        textColor=DARK,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="Bullet2",
        parent=styles["BodyText2"],
        leftIndent=15,
        firstLineIndent=-8,
        bulletIndent=5,
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        name="Small",
        parent=styles["BodyText2"],
        fontSize=8,
        leading=11,
        textColor=MID,
    )
)
styles.add(
    ParagraphStyle(
        name="Caption",
        parent=styles["Small"],
        alignment=TA_CENTER,
        spaceBefore=3,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="HandbookCode",
        parent=styles["BodyText2"],
        fontName="Courier",
        fontSize=8.6,
        leading=12,
        backColor=LIGHT,
        borderColor=RULE,
        borderWidth=0.5,
        borderPadding=6,
        leftIndent=4,
        rightIndent=4,
        spaceBefore=3,
        spaceAfter=7,
    )
)
styles.add(
    ParagraphStyle(
        name="TableHead",
        parent=styles["BodyText2"],
        fontName="Helvetica-Bold",
        textColor=WHITE,
        alignment=TA_LEFT,
        spaceAfter=0,
    )
)
styles.add(
    ParagraphStyle(
        name="TableBody",
        parent=styles["BodyText2"],
        fontSize=8.7,
        leading=12.5,
        spaceAfter=0,
    )
)
styles.add(
    ParagraphStyle(
        name="Callout",
        parent=styles["BodyText2"],
        fontSize=9,
        leading=13.2,
        textColor=DARK,
        spaceAfter=0,
    )
)

def P(text: str, style: str = "BodyText2") -> Paragraph:
    return Paragraph(text, styles[style])


def bullets(items: Iterable[str]) -> list:
    return [P(f"- {item}", "Bullet2") for item in items]


def numbered(items: Iterable[str]) -> list:
    return [P(f"{i}. {item}", "Bullet2") for i, item in enumerate(items, 1)]


def callout(title: str, text: str):
    data = [[P(title, "Minor")], [P(text, "Callout")]]
    table = Table(data, colWidths=[CONTENT_W - 20], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), CYAN),
                ("BOX", (0, 0), (-1, -1), 0.8, TEAL),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, 0), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return table


def make_table(headers: list[str], rows: list[list[str]], widths: list[float]):
    data = [[P(h, "TableHead") for h in headers]]
    for row in rows:
        data.append([P(cell, "TableBody") for cell in row])
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), TEAL),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT]),
                ("GRID", (0, 0), (-1, -1), 0.45, RULE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def figure(num: int, caption: str, max_height: float = 3.15 * inch):
    path = TMP / f"handbook-img-{num:03d}.png"
    if not path.exists():
        return P(f"[Source screenshot {num} unavailable]", "Caption")
    with PILImage.open(path) as im:
        width, height = im.size
    scale = min(CONTENT_W / width, max_height / height)
    image = Image(str(path), width=width * scale, height=height * scale)
    image.hAlign = "CENTER"
    return KeepTogether(
        [
            image,
            P(
                f"{caption}<br/><font color='#607D8B'>Source-language UI shown for visual reference.</font>",
                "Caption",
            ),
        ]
    )


def header_footer(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.5)
        canvas.line(MARGIN_X, PAGE_H - 38, PAGE_W - MARGIN_X, PAGE_H - 38)
        canvas.setFont("Helvetica-Bold", 8)
        canvas.setFillColor(TEAL)
        canvas.drawString(MARGIN_X, PAGE_H - 29, "MILIASTRA SANDBOX")
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(MID)
        canvas.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 29, "Client Script User Guide")
    canvas.setStrokeColor(RULE)
    canvas.line(MARGIN_X, 34, PAGE_W - MARGIN_X, 34)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MID)
    canvas.drawString(MARGIN_X, 22, "English translation - official Miliastra terminology preserved")
    canvas.drawRightString(PAGE_W - MARGIN_X, 22, f"Page {doc.page}")
    canvas.restoreState()


doc = BaseDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    leftMargin=MARGIN_X,
    rightMargin=MARGIN_X,
    topMargin=MARGIN_TOP,
    bottomMargin=MARGIN_BOTTOM,
    title="Miliastra Sandbox Client Script User Guide",
    author="English translation",
    subject="Translated Miliastra client scripting handbook",
)
frame = Frame(
    doc.leftMargin,
    doc.bottomMargin,
    doc.width,
    doc.height,
    leftPadding=0,
    rightPadding=0,
    topPadding=0,
    bottomPadding=0,
)
doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=header_footer)])

story = []

# Cover
story += [
    Spacer(1, 0.72 * inch),
    P("MILIASTRA SANDBOX", "CoverSub"),
    P("Client Script User Guide", "CoverTitle"),
    HRFlowable(width="58%", thickness=2, color=TEAL, spaceBefore=2, spaceAfter=18, hAlign="CENTER"),
    P("Complete English translation of the 17-page Chinese handbook", "CoverSub"),
    P("Terminology aligned with the official Miliastra Client Control API", "CoverSub"),
    Spacer(1, 0.45 * inch),
    callout(
        "Translation note",
        "API identifiers and official object names are preserved exactly. Screenshots are retained from the source document and may contain Chinese editor labels; the surrounding instructions and captions provide the English workflow.",
    ),
    Spacer(1, 0.35 * inch),
    P("<b>Edition:</b> English translation - August 2026", "CoverSub"),
    P("<b>Source:</b> Miliastra Sandbox Client Script Handbook", "CoverSub"),
    PageBreak(),
]

# Contents and terminology
story += [
    P("Contents", "Section"),
    make_table(
        ["Section", "Topics"],
        [
            ["1. Fundamentals", "Capabilities; Server Controls and Client Controls; global scripts"],
            ["2. Working with Client Controls", "Client Control Container; Canvas editing; Client Control creation"],
            ["3. Working with Client Scripts", "Script mappings; local files; attaching scripts; upload rules"],
            ["4. Runtime IDs and Communication", "Template IDs; Script mapping IDs; runtime IDs; signals; lifecycle coupling"],
            ["5. Control Reference", "Container, text, scroller, cursor, button, reference, and Key Hint controls"],
            ["6. Supporting Features", "Controller navigation; localization; audio; logs"],
        ],
        [1.55 * inch, CONTENT_W - 1.55 * inch],
    ),
    Spacer(1, 12),
    P("Official terminology used in this edition", "Subsection"),
    make_table(
        ["Source concept", "English term used"],
        [
            ["Client-side UI element", "Client Control"],
            ["Server-side UI element", "Server Control"],
            ["Client-side host container", "Client Control Container"],
            ["Reusable Client Control asset", "Client Control Template"],
            ["Client script asset registration", "Script mapping"],
            ["Editor test session", "Test Play"],
            ["UI root / hierarchy object", "ClientUIBaseControl"],
            ["Client-to-server signal object", "ServerSignal"],
        ],
        [2.35 * inch, CONTENT_W - 2.35 * inch],
    ),
    PageBreak(),
]

# 1. Fundamentals
story += [
    P("1. Fundamentals", "Section"),
    P("1.1 What Client Scripts can do", "Subsection"),
]
story += bullets(
    [
        "Client Scripts can implement most 2D gameplay, including board and card games, idle games, 2D platformers, and roguelike experiences.",
        "Client Scripts can significantly improve an existing Wonderland's presentation, including dynamic UI behavior and interaction animations.",
    ]
)
story += [
    P("1.2 Server Controls and Client Controls", "Subsection"),
    make_table(
        ["Control type", "Definition and use"],
        [
            [
                "Server Control",
                "Controlled by the server. Before version 7.1, all UI controls were Server Controls. Add them from <b>UI Control Group Library &gt; Server Control Templates</b>.",
            ],
            [
                "Client Control",
                "Designed for use with Client Scripts. Add it from <b>UI Control Group Library &gt; Client Control Templates</b>. A Client Control must exist inside a server-side <b>Client Control Container</b>; it cannot exist independently. A single Client Control Template can be instantiated multiple times.",
            ],
        ],
        [1.35 * inch, CONTENT_W - 1.35 * inch],
    ),
    P("1.3 Global Client Scripts", "Subsection"),
]
story += bullets(
    [
        "In <b>Level Settings &gt; Basic</b>, select which Client Scripts should run as global scripts.",
        "Global scripts begin running earlier than scripts attached to ordinary UI controls.",
    ]
)
story += [
    figure(3, "Level settings and global Client Script configuration", 2.7 * inch),
    PageBreak(),
]

# 2. Client Controls
story += [
    P("2. Working with Client Controls", "Section"),
    P("2.1 Client Control Container requirement", "Subsection"),
    P(
        "Every Client Control shown on the Main Screen must be created inside a Client Control Container. If no Client Control Container exists on the Main Screen at runtime, Client Controls and their scripts will not function.",
    ),
    P("Create a working Client Control setup", "Minor"),
]
story += numbered(
    [
        "Add a <b>Client Control Container</b> in UI Control Group Management. This provides the runtime host required for Client Controls.",
        "Optionally attach the main script to the container through <b>Client Control Container &gt; Canvas Settings &gt; Script &gt; Add Script</b>.",
        "Open the Client Control Container and choose <b>Edit Canvas Settings</b> to edit its Client Controls.",
        "In the container details, choose <b>Add Control</b> and create the required Client Controls.",
        "Keep the server-side Client Control Container enabled and visible. Hiding or disabling it prevents the contained Client Controls from displaying correctly.",
    ]
)
story += [
    figure(4, "Adding a Client Control Container in UI Control Group Management"),
    figure(6, "Opening the Client Control Container Canvas"),
    figure(7, "Editing Client Controls inside the Canvas"),
    figure(9, "Adding the required Client Control"),
    callout("Reference", "For detailed control properties and methods, consult the Client Control API documentation."),
    PageBreak(),
]

# 3. Scripts
story += [
    P("3. Working with Client Scripts", "Section"),
    P(
        "Client Scripts can implement most 2D gameplay and dynamic UI effects. A script runs only when it is attached to a Client Control Template.",
    ),
    P("3.1 Open the Client Script Resource Explorer", "Subsection"),
    P(
        "In Miliastra Sandbox, open <b>Window &gt; Client Script Resource Explorer</b>, then enter the folder where the script should be created.",
    ),
    P("3.2 Method 1 - Create a Script mapping for an existing local file", "Subsection"),
]
story += numbered(
    [
        "Select <b>New Script Mapping</b>.",
        "Edit the mapping's file path. A Script mapping must be associated with a local Lua file before it can run in Test Play.",
        "Choose the local file to map.",
        "Confirm that the mapping shows a successful association.",
    ]
)
story += [
    figure(10, "Creating a new Script mapping"),
    figure(11, "Editing the mapped local file path"),
    figure(12, "Selecting the local Lua file"),
    figure(13, "Successfully associated Script mapping"),
    PageBreak(),
    P("3.3 Method 2 - Create a new Client Script", "Subsection"),
    P(
        "The <b>New Client Script</b> command creates a local script file and a Script mapping at the same time, then links them automatically.",
    ),
]
story += numbered(
    [
        "Select <b>New Client Script</b>.",
        "Enter the local filename and save it. The Script mapping created by this method uses the same name as the local file.",
        "Confirm that both the script and its local file association were created successfully.",
    ]
)
story += [
    figure(14, "Creating a new Client Script and Script mapping"),
    figure(15, "Naming and saving the local script file"),
    figure(16, "Successfully created script and local-file association"),
    P("3.4 Attach a script to a Client Control", "Subsection"),
    P(
        "Open the Client Control's <b>Script</b> tab and choose <b>Add Script</b>. The script must be attached to a Client Control before it can run.",
    ),
    figure(17, "Attaching the Script mapping to a Client Control"),
    P("3.5 Script upload rules", "Subsection"),
]
story += bullets(
    [
        "Only Lua files with a Script mapping in Miliastra Sandbox are packaged and uploaded.",
        "A local Lua file without a Script mapping is not uploaded and cannot run.",
        "Save the local script file first, then save in Miliastra Sandbox and start Test Play for the latest script to take effect.",
    ]
)
story += [PageBreak()]

# 4 IDs and runtime
story += [
    P("4. Runtime IDs, Instantiation, and Communication", "Section"),
    P("4.1 Referencing Client Controls and Scripts", "Subsection"),
]
story += bullets(
    [
        "To reference a Client Control from a script, use its Client Control Template index ID. Select the Client Control in the editor to view this ID. Search the API documentation for <b>uiPrefabId</b> and related template-ID methods.",
        "To call another script, use its Script mapping ID from the Client Script Resource Explorer. Search the API documentation for <b>scriptPrefabId</b> and related methods.",
        "At runtime, each Client Control receives a runtime ID. Search the API documentation for <b>controlId</b> and related lookup methods.",
    ]
)
story += [
    figure(18, "Viewing the Client Control Template index ID"),
    figure(20, "Viewing the Script mapping ID"),
    P("4.2 Dynamic instantiation rules", "Subsection"),
]
story += bullets(
    [
        "Only the root control of a saved Client Control Template can be instantiated dynamically through ClientUIBaseControl APIs.",
        "Client Controls already mounted on the Main Screen cannot be instantiated through script APIs.",
        "Child controls inside a saved Client Control Template cannot be instantiated independently through script APIs.",
    ]
)
story += [
    figure(21, "Template root supported for dynamic instantiation"),
    figure(22, "Controls that cannot be instantiated independently"),
    P("4.3 Client and server communication", "Subsection"),
]
story += bullets(
    [
        "Client to server: create a ServerSignal with <b>game.ServerSignal(signalName)</b>, add parameters, and call <b>SendSignal()</b>. The server listens for the corresponding signal.",
        "Server to client: the server uses the <b>Send Client Script Signal</b> node. The Client Script receives it through <b>script:RegisterServerSignalHandler</b>.",
        "In online play, server-sent signals have a minimum latency of approximately 100 ms.",
    ]
)
story += [
    P("4.4 Coupling between Server Controls and Client Controls", "Subsection"),
]
story += bullets(
    [
        "When the hosting Server Control is visible, the attached Client Controls and scripts operate normally.",
        "If the hosting Server Control is hidden or destroyed, the attached Client Controls are destroyed.",
        "For reconnection recovery, keep important data on the server and reload it during initialization to restore the UI.",
    ]
)
story += [Spacer(1, 8)]

# 5 controls
story += [
    P("5. Detailed Control and Script Features", "Section"),
    P("5.1 Server Control: Client Control Container", "Subsection"),
    make_table(
        ["Item", "Details"],
        [
            ["Add it from", "Server Control Templates &gt; UI Control Group Details &gt; Add Control"],
            ["Purpose", "Hosts and displays client UI in the game. Without it in the UI layout, Client Controls and scripts cannot run or display."],
            ["Typical path", "Client Control Container &gt; Canvas Settings (Edit) &gt; Container Control &gt; Script (Add Script)"],
        ],
        [1.25 * inch, CONTENT_W - 1.25 * inch],
    ),
    P("5.2 Client Control overview", "Subsection"),
    callout(
        "Static-only properties",
        "Some properties are not exposed to scripts and can only be configured statically. Consult the annotated declaration/reference for exact script-accessible members.",
    ),
    make_table(
        ["Official control term", "Purpose and API lookup term"],
        [
            ["ContainerControl", "Hierarchy anchor for other controls. Can keep the cursor visible and block selected event passthrough. Search the API for <b>ContainerControl</b>."],
            ["TextBoxControl", "Displays configurable ordinary text. Search the API for <b>TextBoxControl</b>."],
            ["TextWindowControl", "Displays scrollable text. Search the API for <b>TextWindowControl</b>."],
            ["GridScrollerControl", "Reusable scrolling list suitable for inventories and product lists. Search the API for <b>GridScrollerControl</b>."],
            ["CursorEventArea", "Detects cursor events within a configured region. Search the API for <b>CursorEventArea</b>."],
            ["PresetButton", "Interactive four-state button with per-state visibility, linked keys, and click audio. Search the API for <b>PresetButton</b>."],
            ["ReferenceControl", "References another template and provides a preview. Useful when several repeated controls must share one editable template. Search the API for <b>ReferenceControl</b>."],
            ["KeyHintControl", "Visual key-prompt control for keyboard/mouse and controller bindings. It affects presentation only and does not handle input events."],
        ],
        [1.65 * inch, CONTENT_W - 1.65 * inch],
    ),
    P("GridScrollerControl notes", "Minor"),
]
story += bullets(
    [
        "Only templates configured as the list item source receive the Grid Scroller's list-scrolling behavior.",
        "Controls placed directly under the Grid Scroller hierarchy do not receive the Grid Scroller list-scrolling behavior.",
        "Some Grid Scroller properties are static-only; consult the annotated declaration for exact availability.",
    ]
)
story += [
    P("5.3 Rearranging the control hierarchy", "Subsection"),
    P(
        "In UI Control Group Management, any list that permits hierarchy changes supports drag-and-drop reordering of the control hierarchy and structure.",
    ),
    figure(32, "Drag-and-drop control hierarchy editing", 3.35 * inch),
    PageBreak(),
]

# 6 support
story += [
    P("6. Supporting Features", "Section"),
    P("6.1 Controller navigation", "Subsection"),
    P("Container navigation isolation", "Minor"),
]
story += bullets(
    [
        "When <b>IsolateNavigation</b> is enabled on a ContainerControl, nearest-control navigation does not cross between controls inside and outside the container.",
    ]
)
story += [
    figure(33, "Container controller-navigation isolation"),
    P("Script configuration", "Minor"),
]
story += bullets(
    [
        "Controls alone cannot provide a complete controller-navigation configuration; handle the remaining adaptation logic in a Client Script.",
        "Specify the control that should receive initial focus by using <b>game.SetControllerFocus</b> and inspect focus with <b>game.GetControllerFocus</b>.",
    ]
)
story += [
    figure(34, "Controller focus configuration in script"),
    P("6.2 Localization", "Subsection"),
]
story += bullets(
    [
        "Manage script localization through <b>Manage Multi-language Text &gt; Script Text Variables</b>.",
        "After configuring a <b>TextMap ID</b>, retrieve the localized value with <b>game.GetText(textMapId)</b>.",
    ]
)
story += [
    figure(35, "Script Text Variables and localization workflow"),
    P("6.3 Audio", "Subsection"),
    P(
        "Use <b>game.PlayAudio2D(audioId)</b> for configured 2D audio. The method returns an audio instance ID that can be passed to <b>game.StopAudio</b> and <b>game.IsAudioAlive</b>.",
    ),
    Spacer(1, 8),
    P("6.4 Logs", "Subsection"),
    P(
        "The log tools display information and error details generated while Client Scripts are running.",
    ),
    P("Using the log viewer", "Minor"),
]
story += bullets(
    [
        "To begin debugging, select <b>Client Script</b> in the log viewer and confirm the selection.",
        "If a script error occurs during Test Play, double-click the error entry to view its details.",
    ]
)
story += [
    figure(36, "Client Script log viewer and error details", 3.55 * inch),
    P("Local ErrorLog.txt", "Minor"),
]
story += bullets(
    [
        "Recursive calls or similar runtime problems can make level loading extremely slow or appear frozen, preventing the normal log viewer from reporting the issue.",
        "In that case, check the local log stored beside the Client Script files. The filename is <b>ErrorLog.txt</b>.",
        "ErrorLog.txt is created only when an error cannot be reported through the normal log viewer.",
    ]
)
story += [
    Spacer(1, 14),
    HRFlowable(width="100%", thickness=0.8, color=RULE),
    Spacer(1, 8),
    P(
        "<b>End of translated handbook.</b> API names and identifiers were checked against the official Miliastra terminology maintained in this project.",
        "Small",
    ),
]

doc.build(story)
print(OUTPUT)
