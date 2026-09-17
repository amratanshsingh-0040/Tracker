import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether

def build_pdf(filename="COFOUNDER_SETUP_GUIDE.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary = colors.HexColor("#4f46e5")
    dark = colors.HexColor("#0f172a")
    slate = colors.HexColor("#334155")
    light_bg = colors.HexColor("#f8fafc")
    emerald = colors.HexColor("#059669")
    emerald_bg = colors.HexColor("#ecfdf5")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=dark,
        spaceAfter=3
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=14
    )

    section_header = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=primary,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    step_title = ParagraphStyle(
        'StepTitle',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=dark,
        spaceBefore=5,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=slate
    )

    bold_body = ParagraphStyle(
        'BoldBody',
        parent=body_style,
        fontName='Helvetica-Bold',
        textColor=dark
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Code'],
        fontName='Courier-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#0f172a")
    )

    story = []

    # Header
    story.append(Paragraph("Company Expense Tracker — Non-Technical Setup Guide", title_style))
    story.append(Paragraph("Zero-Coding Setup Guide for Windows & Mac · Everything You Need From Scratch", subtitle_style))

    # Important Note Box
    note_text = """
    <b>💡 2 Important Things to Know First:</b><br/>
    <b>1. Do you need to install React separately?</b> <b>No.</b> React is already included in the project files. It will be installed automatically with one simple command in Step 3.<br/>
    <b>2. Do you need MySQL or MySQL Workbench?</b> <b>No!</b> The app uses an embedded database (SQLite) that lives directly inside the project folder. You do <b>NOT</b> need to install MySQL, configure servers, or set up passwords.
    """
    note_p = Paragraph(note_text, ParagraphStyle('NoteText', parent=body_style, fontSize=9, leading=13, textColor=colors.HexColor("#1e1b4b")))
    note_table = Table([[note_p]], colWidths=[532])
    note_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#eef2ff")),
        ('BORDER', (0,0), (-1,-1), 1, colors.HexColor("#c7d2fe")),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
    ]))
    story.append(note_table)
    story.append(Spacer(1, 10))

    # PART 1: The 3 Tools
    story.append(Paragraph("PART 1: Install the 3 Free Tools (One-Time Only)", section_header))

    tools_data = [
        [
            Paragraph("<b>1. Node.js</b>", bold_body),
            Paragraph("Allows your computer to run the application server.", body_style),
            Paragraph("Download LTS version at:<br/><b>https://nodejs.org</b><br/><i>Click Next on all prompts to install.</i>", body_style)
        ],
        [
            Paragraph("<b>2. Git</b>", bold_body),
            Paragraph("Allows you to download (clone) the project files from GitHub.", body_style),
            Paragraph("Download at:<br/><b>https://git-scm.com/downloads</b><br/><i>Click Next on standard default settings.</i>", body_style)
        ],
        [
            Paragraph("<b>3. VS Code</b>", bold_body),
            Paragraph("Visual Studio Code makes it easy to open the project and terminal.", body_style),
            Paragraph("Download at:<br/><b>https://code.visualstudio.com</b><br/><i>Check 'Create desktop icon' & install.</i>", body_style)
        ]
    ]
    t_tools = Table(tools_data, colWidths=[100, 200, 232])
    t_tools.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_tools)
    story.append(Spacer(1, 10))

    # PART 2: Cloning from GitHub
    story.append(Paragraph("PART 2: Download (Clone) the Project from GitHub", section_header))
    clone_steps = """
    <b>1. Open VS Code</b> on your computer.<br/>
    <b>2. Open the Terminal:</b> Press <b>Ctrl + `</b> (the key above Tab) or click <b>Terminal &gt; New Terminal</b> at the top menu.<br/>
    <b>3. Navigate to Desktop:</b> Type <code>cd Desktop</code> and press Enter.<br/>
    <b>4. Download the repository:</b> Type:<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;<code>git clone &lt;YOUR_GITHUB_REPOSITORY_URL&gt;</code> and press Enter.<br/>
    <b>5. Enter the project folder:</b> Type <code>cd Tracker</code> and press Enter.
    """
    story.append(Paragraph(clone_steps, body_style))
    story.append(Spacer(1, 10))

    # PART 3: 1-Step Setup
    story.append(Paragraph("PART 3: Automatic 1-Click Setup (Run Once)", section_header))
    setup_steps = """
    Inside that same terminal in VS Code, type this single command:
    """
    story.append(Paragraph(setup_steps, body_style))

    code_table = Table([[Paragraph("npm run setup", code_style)]], colWidths=[532])
    code_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#0f172a")),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.white),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    code_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#0f172a")),
    ]))
    # make white text for code
    code_table = Table([[Paragraph("<font color='white'><b>npm run setup</b></font>", code_style)]], colWidths=[532])
    code_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#0f172a")),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(code_table)
    story.append(Paragraph("⏳ <i>Your computer will automatically download React, backend modules, and database libraries. Wait 1–2 minutes until finished.</i>", body_style))

    story.append(PageBreak())

    # PAGE 2
    story.append(Paragraph("PART 4: Running the App Daily", section_header))
    story.append(Paragraph("Whenever you want to start the Tracker, run this command in terminal:", body_style))
    dev_table = Table([[Paragraph("<font color='white'><b>npm run dev</b></font>", code_style)]], colWidths=[532])
    dev_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#0f172a")),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(dev_table)
    story.append(Paragraph("<b>Windows Shortcut:</b> You can also just go to the <code>Tracker</code> folder and <b>double-click start.bat</b>!", body_style))
    story.append(Paragraph("Now open your browser (Chrome, Edge, Brave) and visit: <font color='#4f46e5'><b>http://localhost:3000</b></font>", bold_body))
    story.append(Spacer(1, 10))

    # PART 5: Login Credentials
    story.append(Paragraph("PART 5: Sign In Credentials", section_header))
    creds_data = [
        [
            Paragraph("<b>Email:</b> <code>admin@company.com</code>", bold_body),
            Paragraph("<b>Password:</b> <code>admin123</code>", bold_body)
        ]
    ]
    t_creds = Table(creds_data, colWidths=[266, 266])
    t_creds.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), emerald_bg),
        ('BORDER', (0,0), (-1,-1), 1, colors.HexColor("#a7f3d0")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_creds)
    story.append(Paragraph("<i>* You can change your password anytime by clicking the 'Team' button in the top bar &gt; 'Change My Password' tab.</i>", body_style))
    story.append(Spacer(1, 10))

    # PART 6: How to Use Quick Reference Table
    story.append(Paragraph("PART 6: Daily Features Quick Reference", section_header))
    usage_data = [
        [Paragraph("<b>Feature</b>", bold_body), Paragraph("<b>How to Do It</b>", bold_body)],
        [
            Paragraph("<b>Add an Expense</b>", bold_body),
            Paragraph("Click <b>'+ Add Expense'</b> in the top right. Enter amount in INR (Rs.), who you paid, category, and attach receipt bill (PDF or photo).", body_style)
        ],
        [
            Paragraph("<b>View / Download Receipts</b>", bold_body),
            Paragraph("Click any receipt thumbnail in the table to open the full invoice with zoom and download buttons.", body_style)
        ],
        [
            Paragraph("<b>Add 1–2 Team Members</b>", bold_body),
            Paragraph("Click <b>'Team'</b> in the top navigation bar &gt; enter their Name, Email, Password &gt; click <b>'Add Person'</b>. (Admins only).", body_style)
        ],
        [
            Paragraph("<b>Check Overdue Items</b>", bold_body),
            Paragraph("Items pending for 5+ days alert you in a yellow banner or via the bell notification icon in the top right.", body_style)
        ],
        [
            Paragraph("<b>Turn Off the App</b>", bold_body),
            Paragraph("Press <b>Ctrl + C</b> in the terminal window (or just close the terminal window).", body_style)
        ],
        [
            Paragraph("<b>Start Tomorrow</b>", bold_body),
            Paragraph("Run <code>npm run dev</code> (or double-click <code>start.bat</code>) and visit <b>http://localhost:3000</b>.", body_style)
        ]
    ]
    t_usage = Table(usage_data, colWidths=[140, 392])
    t_usage.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_usage)
    story.append(Spacer(1, 10))

    # PART 7: Password Recovery & Support
    story.append(Paragraph("PART 7: Emergency Password Recovery (If Locked Out)", section_header))
    recovery_text = """
    <b>Option A (Website UI):</b> On the login page, click <b>'Forgot password?'</b> and enter your email with the Master Recovery Key: <code>apex-recovery-key-2026</code> to reset your password.<br/>
    <b>Option B (Terminal Failsafe):</b> In your terminal inside the project folder, run:<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;<code>npm run reset-admin MyNewPassword123</code><br/>
    This will instantly reset the admin password.
    """
    story.append(Paragraph(recovery_text, body_style))

    doc.build(story)
    print("PDF build complete:", filename)

if __name__ == "__main__":
    build_pdf("c:/Users/acer/OneDrive/Documents/Desktop/Tracker/COFOUNDER_SETUP_GUIDE.pdf")
