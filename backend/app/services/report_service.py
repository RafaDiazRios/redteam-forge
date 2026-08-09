"""
Report Service - Generación de reportes profesionales de penetration testing.
"""
import os
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)


class ReportService:
    def __init__(self, reports_dir: Path):
        self.reports_dir = reports_dir
    
    def _severity_color(self, severity: str) -> tuple:
        """Devuelve color RGB para cada nivel de severidad."""
        colors = {
            "Critical": (0.8, 0.1, 0.1),
            "High": (0.9, 0.4, 0.0),
            "Medium": (0.9, 0.7, 0.0),
            "Low": (0.2, 0.6, 0.2),
            "Info": (0.2, 0.4, 0.8)
        }
        return colors.get(severity, (0.5, 0.5, 0.5))
    
    async def generate_pdf_report(
        self,
        engagement_name: str,
        client_name: str,
        report_data: dict,
        report_id: int
    ) -> str:
        """Genera un reporte PDF profesional de penetration testing."""
        
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import cm
            from reportlab.lib import colors
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
            from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
            
            report_path = self.reports_dir / f"report_{report_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            doc = SimpleDocTemplate(
                str(report_path),
                pagesize=A4,
                rightMargin=2*cm,
                leftMargin=2*cm,
                topMargin=2*cm,
                bottomMargin=2*cm
            )
            
            styles = getSampleStyleSheet()
            
            # Estilos personalizados
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Title'],
                fontSize=24,
                spaceAfter=12,
                textColor=colors.HexColor('#1a1a2e')
            )
            
            heading1_style = ParagraphStyle(
                'CustomH1',
                parent=styles['Heading1'],
                fontSize=16,
                spaceBefore=12,
                spaceAfter=6,
                textColor=colors.HexColor('#16213e')
            )
            
            heading2_style = ParagraphStyle(
                'CustomH2',
                parent=styles['Heading2'],
                fontSize=13,
                spaceBefore=8,
                spaceAfter=4,
                textColor=colors.HexColor('#0f3460')
            )
            
            body_style = ParagraphStyle(
                'CustomBody',
                parent=styles['Normal'],
                fontSize=10,
                spaceAfter=6,
                leading=14,
                alignment=TA_JUSTIFY
            )
            
            code_style = ParagraphStyle(
                'Code',
                parent=styles['Normal'],
                fontSize=8,
                fontName='Courier',
                backColor=colors.HexColor('#f4f4f4'),
                spaceAfter=6
            )
            
            story = []
            
            # Portada
            story.append(Spacer(1, 2*cm))
            story.append(Paragraph("PENETRATION TESTING REPORT", title_style))
            story.append(Paragraph(f"<b>Engagement:</b> {engagement_name}", styles['Normal']))
            story.append(Paragraph(f"<b>Client:</b> {client_name}", styles['Normal']))
            story.append(Paragraph(f"<b>Date:</b> {datetime.now().strftime('%B %d, %Y')}", styles['Normal']))
            story.append(Paragraph("<b>Classification:</b> CONFIDENTIAL", styles['Normal']))
            story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#e94560')))
            story.append(Spacer(1, 1*cm))
            
            # Resumen ejecutivo
            story.append(Paragraph("1. Executive Summary", heading1_style))
            exec_summary = report_data.get("executive_summary", "No summary available.")
            story.append(Paragraph(exec_summary, body_style))
            story.append(Spacer(1, 0.5*cm))
            
            # Resumen de severidad
            severity_counts = report_data.get("severity_counts", {})
            if severity_counts:
                story.append(Paragraph("2. Vulnerability Summary", heading1_style))
                
                sev_data = [
                    ["Severity", "Count"],
                    ["Critical", str(severity_counts.get("critical", 0))],
                    ["High", str(severity_counts.get("high", 0))],
                    ["Medium", str(severity_counts.get("medium", 0))],
                    ["Low", str(severity_counts.get("low", 0))],
                    ["Info", str(severity_counts.get("info", 0))],
                ]
                
                sev_table = Table(sev_data, colWidths=[10*cm, 5*cm])
                sev_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a2e')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 11),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f8f8')]),
                    ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#ffcccc')),  # Critical
                    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#ffe0cc')),  # High
                    ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#fff3cc')),  # Medium
                    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#ccffcc')),  # Low
                ]))
                story.append(sev_table)
                story.append(Spacer(1, 0.5*cm))
            
            # Findings detallados
            findings = report_data.get("findings", [])
            if findings:
                story.append(Paragraph("3. Detailed Findings", heading1_style))
                
                for i, finding in enumerate(findings):
                    story.append(Paragraph(
                        f"3.{i+1} [{finding.get('severity', 'Unknown')}] {finding.get('title', 'Unknown')}",
                        heading2_style
                    ))
                    
                    # Tabla de metadata
                    meta_data = [
                        ["Field", "Value"],
                        ["ID", finding.get("id", f"VULN-{i+1:03d}")],
                        ["Severity", finding.get("severity", "Unknown")],
                        ["CVE", finding.get("cve", "N/A") or "N/A"],
                        ["CWE", finding.get("cwe", "N/A") or "N/A"],
                        ["MITRE ATT&CK", finding.get("mitre_technique", "N/A") or "N/A"],
                    ]
                    
                    meta_table = Table(meta_data, colWidths=[5*cm, 12*cm])
                    meta_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#16213e')),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                        ('FONTSIZE', (0, 0), (-1, -1), 9),
                        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f8f8')]),
                    ]))
                    story.append(meta_table)
                    story.append(Spacer(1, 0.3*cm))
                    
                    if finding.get("description"):
                        story.append(Paragraph("<b>Description:</b>", body_style))
                        story.append(Paragraph(finding["description"], body_style))
                    
                    if finding.get("proof_of_concept"):
                        story.append(Paragraph("<b>Proof of Concept:</b>", body_style))
                        poc_text = finding["proof_of_concept"].replace('<', '&lt;').replace('>', '&gt;')
                        story.append(Paragraph(poc_text[:500], code_style))
                    
                    if finding.get("business_impact"):
                        story.append(Paragraph("<b>Business Impact:</b>", body_style))
                        story.append(Paragraph(finding["business_impact"], body_style))
                    
                    if finding.get("remediation"):
                        story.append(Paragraph("<b>Remediation:</b>", body_style))
                        story.append(Paragraph(finding["remediation"], body_style))
                    
                    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
                    story.append(Spacer(1, 0.3*cm))
            
            # Attack Chain
            attack_chain = report_data.get("attack_chain", "")
            if attack_chain:
                story.append(Paragraph("4. Attack Chain", heading1_style))
                story.append(Paragraph(attack_chain, body_style))
                story.append(Spacer(1, 0.5*cm))
            
            # Remediation Roadmap
            roadmap = report_data.get("remediation_roadmap", [])
            if roadmap:
                story.append(Paragraph("5. Remediation Roadmap", heading1_style))
                for j, item in enumerate(roadmap):
                    story.append(Paragraph(f"{j+1}. {item}", body_style))
            
            # Footer
            story.append(Spacer(1, 1*cm))
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e94560')))
            story.append(Paragraph(
                f"<i>This report is confidential and intended solely for {client_name}. "
                f"Generated by RedTeam Forge on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}.</i>",
                ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey)
            ))
            
            doc.build(story)
            
            return str(report_path)
        
        except Exception as e:
            logger.error(f"Error generando PDF: {e}")
            # Fallback: generar reporte en Markdown
            return await self._generate_markdown_report(engagement_name, client_name, report_data, report_id)
    
    async def _generate_markdown_report(
        self, engagement_name: str, client_name: str, report_data: dict, report_id: int
    ) -> str:
        """Genera reporte en Markdown como fallback."""
        report_path = self.reports_dir / f"report_{report_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        
        lines = [
            f"# Penetration Testing Report",
            f"",
            f"**Engagement:** {engagement_name}",
            f"**Client:** {client_name}",
            f"**Date:** {datetime.now().strftime('%B %d, %Y')}",
            f"**Classification:** CONFIDENTIAL",
            f"",
            f"---",
            f"",
            f"## Executive Summary",
            f"",
            report_data.get("executive_summary", ""),
            f"",
        ]
        
        findings = report_data.get("findings", [])
        if findings:
            lines.extend(["## Findings", ""])
            for finding in findings:
                lines.extend([
                    f"### [{finding.get('severity', 'Unknown')}] {finding.get('title', 'Unknown')}",
                    f"",
                    f"- **ID:** {finding.get('id', 'N/A')}",
                    f"- **CVE:** {finding.get('cve', 'N/A')}",
                    f"- **MITRE:** {finding.get('mitre_technique', 'N/A')}",
                    f"",
                    f"**Description:** {finding.get('description', '')}",
                    f"",
                    f"**Remediation:** {finding.get('remediation', '')}",
                    f"",
                    "---",
                    ""
                ])
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))
        
        return str(report_path)


_report_service_instance = None

def get_report_service(reports_dir: Path) -> ReportService:
    global _report_service_instance
    if _report_service_instance is None:
        _report_service_instance = ReportService(reports_dir)
    return _report_service_instance
