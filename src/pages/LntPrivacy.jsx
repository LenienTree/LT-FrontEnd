import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Printer, Download, Shield, ShieldCheck, Mail, MapPin, Calendar, FileText } from "lucide-react";

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState("introduction");

  const sections = [
    { id: "introduction", title: "Introduction & Recitals" },
    { id: "definitions", title: "1. Definitions" },
    { id: "scope", title: "2. Scope & Applicability" },
    { id: "collection", title: "3. Data Collection & Notice" },
    { id: "lawful-basis", title: "4. Lawful Basis for Processing" },
    { id: "consent-withdrawal", title: "5. Consent & Withdrawal" },
    { id: "children", title: "6. Special Provisions for Children" },
    { id: "usage", title: "7. How We Use Information" },
    { id: "sharing", title: "8. How We Share Information" },
    { id: "cookies", title: "9. Cookies & Tracking" },
    { id: "rights", title: "10. Data Principal Rights" },
    { id: "security", title: "11. Data Security & Breach" },
    { id: "retention", title: "12. Data Retention & Erasure" },
    { id: "third-party", title: "13. Third-Party Services" },
    { id: "international", title: "14. International Transfers" },
    { id: "changes", title: "15. Policy Changes" },
    { id: "governing-law", title: "16. Governing Law" },
    { id: "dispute-resolution", title: "17. Dispute Resolution" },
    { id: "grievance-dpo", title: "18. Grievance Redressal & DPO" },
    { id: "notices", title: "19. Notices" },
    { id: "effective-date", title: "Effective Date & Acceptance" }
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;

      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 120;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setActiveSection(id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0a1414] text-gray-200 font-urbanist relative overflow-hidden">
      {/* Visual background accents */}
      <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 bg-[#00ff88]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 bg-[#022f2e]/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Header / Nav */}
      <header className="sticky top-0 z-50 bg-[#0a1414]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#00ff88]" />
                <h1 className="text-xl font-bold text-white tracking-wide">Lenient Tree</h1>
              </div>
              <p className="text-xs text-gray-400">Version 2.0 (DPDPA Compliance Update)</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-300 text-sm"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Policy</span>
            </button>
            <a
              href="/Privacy Policy- Lenient Tree.pdf"
              download="Privacy Policy- Lenient Tree.pdf"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#00ff88] to-[#00cc70] hover:from-[#00cc70] hover:to-[#00ff88] text-[#0a1414] font-bold py-2.5 px-4 rounded-xl transition-all duration-300 text-sm shadow-lg shadow-[#00ff88]/10"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download PDF</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Header Page Title */}
      <section className="bg-gradient-to-b from-[#022f2e]/30 to-transparent py-16 px-6 relative border-b border-white/5">
        <div className="max-w-7xl mx-auto text-center md:text-left md:flex md:items-center md:justify-between">
          <div>
            <span className="text-xs font-semibold text-[#00ff88] uppercase tracking-[0.2em] mb-2 block">
              Legal Documents
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              Privacy Policy
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mt-3 max-w-2xl leading-relaxed">
              This Privacy Policy explains how Lenient Tree collects, uses, stores, and processes your digital personal data in compliance with the Digital Personal Data Protection Act, 2023 (DPDPA 2023) of India.
            </p>
          </div>
          <div className="mt-8 md:mt-0 flex gap-4 justify-center md:justify-end text-sm text-gray-400">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center min-w-[140px]">
              <Calendar className="w-5 h-5 text-[#00ff88] mb-2" />
              <span>Effective Date</span>
              <span className="text-white font-semibold mt-1">May 28, 2026</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center min-w-[140px]">
              <ShieldCheck className="w-5 h-5 text-[#00ff88] mb-2" />
              <span>Status</span>
              <span className="text-[#00ff88] font-semibold mt-1">DPDPA Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          {/* Sticky Sidebar Navigation */}
          <aside className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-28 bg-white/5 border border-white/10 rounded-3xl p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider border-b border-white/10 pb-2">
                Table of Contents
              </h3>
              <ul className="space-y-1.5 text-sm">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left py-2 px-3 rounded-xl transition-all duration-200 ${
                        activeSection === section.id
                          ? "bg-[#00ff88]/10 text-[#00ff88] font-semibold pl-4"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Policy Text Content */}
          <main className="lg:col-span-3 space-y-12 text-gray-300 leading-relaxed select-text">
            
            {/* Introduction */}
            <section id="introduction" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                Introduction &amp; Recitals
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <p>
                  This Privacy Policy (<strong>&quot;Policy&quot;</strong>) is issued by Lenient Tree, the owner and operator of the digital platform located at <a href="https://www.lenienttree.com/" className="text-[#00ff88] hover:underline">https://www.lenienttree.com/</a> (hereinafter referred to as <strong>&quot;Lenient Tree,&quot; &quot;we,&quot; &quot;us,&quot;</strong> or <strong>&quot;our&quot;</strong>). This Policy serves as a formal disclosure to all users, students, and visitors (collectively referred to as <strong>&quot;Data Principals&quot;</strong>) regarding the collection, storage, and processing of their digital personal data.
                </p>
                <p>
                  In accordance with the Digital Personal Data Protection Act, 2023 (<strong>&quot;DPDPA 2023&quot;</strong>), Lenient Tree operates as a <strong>&quot;Data Fiduciary.&quot;</strong> We recognize our legal and ethical responsibility to process personal data in a manner that respects the rights of Data Principals while ensuring the security and integrity of the information entrusted to us. This Policy outlines the categories of data we process, the specific purposes of such processing, and the robust safeguards we have implemented to protect your privacy.
                </p>
                <p>
                  This document is identified as Version 2.0 (DPDPA Compliance Update), representing a significant revision to our data handling practices to ensure full alignment with the statutory mandates of the DPDPA 2023. This version supersedes any previous privacy policies or data handling statements issued by Lenient Tree prior to the effective date mentioned herein.
                </p>
                <div className="bg-[#022f2e]/20 border-l-4 border-[#00ff88] p-4 rounded-r-xl mt-4 text-sm text-gray-400">
                  <strong>WHEREAS:</strong>
                  <ul className="list-disc list-inside space-y-2 mt-2">
                    <li>Lenient Tree owns and operates the website located at www.lenienttree.com, providing a platform for student competitions, portfolio building, and event management services that involve the systematic processing of personal data.</li>
                    <li>The Parliament of India has enacted the Digital Personal Data Protection Act, 2023 (&quot;DPDPA&quot;) to regulate the processing of digital personal data.</li>
                    <li>The Data Fiduciary is committed to upholding the highest standards of data privacy and security.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 1: Definitions */}
            <section id="definitions" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                1. Definitions
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">1.1 Act</h4>
                  <p>Refers to the Digital Personal Data Protection Act, 2023, along with any rules, regulations, notifications, and guidelines issued thereunder, as amended from time to time.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">1.2 Child</h4>
                  <p>Means an individual who has not completed eighteen years of age, as defined under Section 2(f) of the Act.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">1.3 Data Fiduciary</h4>
                  <p>Refers to Lenient Tree, which, alone or in conjunction with other persons, determines the purpose and means of processing of personal data under this Privacy Policy.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">1.4 Data Principal</h4>
                  <p>Means the individual to whom the personal data relates and where such individual is a child, includes the parents or lawful guardian of such child, and where such individual is a person with a disability, includes her lawful guardian, acting on her behalf.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">1.5 Data Processor</h4>
                  <p>Means any person who processes personal data on behalf of Lenient Tree as the Data Fiduciary.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">1.6 Personal Data</h4>
                  <p>Means any data about an individual who is identifiable by or in relation to such data, including data that is in digital form or is subsequently digitized after being collected in non-digital form.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">1.7 Processing</h4>
                  <p>In relation to personal data, means a wholly or partly automated operation or a set of operations performed on digital personal data, and includes operations such as collection, recording, organisation, structuring, storage, adaptation, alteration, retrieval, use, alignment or combination, indexing, sharing, disclosure by transmission, dissemination or otherwise making available, restriction, erasure, or destruction.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">1.8 Website</h4>
                  <p>Refers to the digital platform owned and operated by Lenient Tree, accessible via the URL https://www.lenienttree.com/ and any associated sub-domains or mobile-responsive versions.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">1.9 Data Protection Board</h4>
                  <p>Refers to the Data Protection Board of India established by the Central Government under the Act to oversee compliance and adjudicate grievances.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">1.10 Consent Manager</h4>
                  <p>Refers to a person registered with the Board who acts as a single point of contact to enable a Data Principal to give, manage, review, and withdraw her consent through an accessible, transparent, and interoperable platform.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">1.11 Grievance Officer</h4>
                  <p>Refers to the individual appointed by Lenient Tree to address the queries or grievances of Data Principals regarding the processing of their personal data.</p>
                </div>
              </div>
            </section>

            {/* Section 2: Scope & Applicability */}
            <section id="scope" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                2. Scope and Applicability
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">2.1 Material Scope</h4>
                  <p>This Privacy Policy applies to the processing of all digital personal data collected, received, possessed, stored, dealt with, or handled by Lenient Tree through its website located at www.lenienttree.com (the &quot;Website&quot;) and all associated services, digital platforms, competition portals, and tools offered by Lenient Tree (collectively, the &quot;Services&quot;).</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">2.2 Applicability to Data Principals</h4>
                  <p>This Policy is applicable to all individuals whose personal data is processed by Lenient Tree, including but not limited to:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2 text-gray-400 pl-2">
                    <li>Students and individual users who register an account or participate in competitions and hackathons.</li>
                    <li>Representatives of educational institutions, sponsors, and corporate partners who interact with the Website.</li>
                    <li>Any visitor or guest who accesses the Website for informational purposes.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">2.3 Nature of Data Processed</h4>
                  <p>This Policy governs personal data that is collected in digital form directly from the Data Principal through the Website, or collected in non-digital form and subsequently digitized by Lenient Tree for the purpose of providing Services.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">2.4 Territorial Applicability</h4>
                  <p>This Policy applies to the processing of digital personal data within the territory of India. It also extends to the processing of digital personal data outside the territory of India if such processing is in connection with any activity related to the offering of goods or services to Data Principals within the territory of India.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">2.5 Boundaries of Data Processing</h4>
                  <p>This Policy applies exclusively to the data processing activities conducted under the control of Lenient Tree. It does not apply to personal data processed by an individual for any personal or domestic purpose, personal data made publicly available by the Data Principal themselves, or third-party websites, applications, or services that may be linked on the Website.</p>
                </div>
              </div>
            </section>

            {/* Section 3: Data Collection & Notice */}
            <section id="collection" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                3. Notice of Data Collection and Purposes
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <p>We collect and process digital personal data from you in the following categories:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                    <h4 className="text-white font-bold text-base mb-2 text-[#00ff88]">Identity Data</h4>
                    <p className="text-sm text-gray-400">
                      We collect personal identifiers, including but not limited to, the Data Principal&apos;s full legal name and date of birth. This is essential to verify identity, ensure minimum age requirements, and validate eligibility criteria for competitions.
                    </p>
                  </div>
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                    <h4 className="text-white font-bold text-base mb-2 text-[#00ff88]">Contact Data</h4>
                    <p className="text-sm text-gray-400">
                      We collect contact information, specifically the Data Principal&apos;s email address and mobile phone number. This is processed to transmit critical notifications, registration confirmations, administrative updates, and security alerts.
                    </p>
                  </div>
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                    <h4 className="text-white font-bold text-base mb-2 text-[#00ff88]">Professional &amp; Academic Data</h4>
                    <p className="text-sm text-gray-400">
                      We collect academic affiliation (College/University), technical competencies, and professional code repository links (such as GitHub). This is utilized to construct your professional profile and facilitate matching with event sponsors or recruiters.
                    </p>
                  </div>
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                    <h4 className="text-white font-bold text-base mb-2 text-[#00ff88]">Transaction Data</h4>
                    <p className="text-sm text-gray-400">
                      In the event of paid registrations or financial transactions on the Website, we collect transaction logs and payment metadata. This is processed to manage registration fees, maintain accurate records, and comply with statutory audit/tax requirements in India.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Lawful Basis for Processing */}
            <section id="lawful-basis" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                4. Lawful Basis for Processing
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">4.1 Consent-Based Processing</h4>
                  <p>In accordance with Section 4 and Section 6 of the Act, the primary legal ground for processing personal data is the free, specific, informed, unconditional, and unambiguous consent of the Data Principal. Such consent is obtained through a clear affirmative action at the point of data collection.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">4.2 Certain Legitimate Uses</h4>
                  <p>Lenient Tree may process personal data without obtaining express consent for certain legitimate uses as prescribed under Section 7 of the Act, including:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2 text-gray-400 pl-2">
                    <li>Situations where the Data Principal voluntarily provides personal data for a specified purpose.</li>
                    <li>Processing necessary for the performance of any function under any law in force in India or in the interest of sovereignty and security of the State.</li>
                    <li>Compliance with any judgment, decree, or order issued under law.</li>
                    <li>Responding to a medical emergency involving a threat to life or severe threat to health.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 5: Consent & Withdrawal */}
            <section id="consent-withdrawal" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                5. Consent and Withdrawal
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <p>
                  The Data Principal shall have the right to withdraw their consent at any time. The ease of withdrawing consent shall be comparable to the ease with which consent was initially given. Upon withdrawal, Lenient Tree and its Data Processors shall, within a reasonable time, cease processing the personal data.
                </p>
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 mt-4">
                  <h4 className="text-white font-bold text-base mb-2">Withdrawal Mechanisms:</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="text-[#00ff88] mt-1 font-bold">•</span>
                      <div>
                        <strong>Privacy Dashboard:</strong> Log in and utilize toggle switches or deletion requests within the Privacy Dashboard to revoke consent.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#00ff88] mt-1 font-bold">•</span>
                      <div>
                        <strong>Electronic Communication:</strong> Send an email to the Data Protection Officer at <a href="mailto:dpo@lenienttree.com" className="text-[#00ff88] hover:underline">dpo@lenienttree.com</a> with the subject line &quot;Withdrawal of Consent.&quot;
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 6: Children */}
            <section id="children" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                6. Special Provisions for Children
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <p>
                  In accordance with Section 2(f) of the Act, a &quot;Child&quot; is defined as an individual who has not completed eighteen years of age. Lenient Tree shall not process the personal data of a child without obtaining the verifiable consent of the parent or lawful guardian.
                </p>
                <div className="bg-red-950/20 border border-red-500/30 p-5 rounded-2xl mt-4">
                  <h4 className="text-red-400 font-bold text-base mb-2">Prohibited Processing Activities for Children:</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-400">
                    <li><strong>Behavioral Tracking:</strong> We shall not track, monitor, or profile the online behavior of children.</li>
                    <li><strong>Targeted Advertising:</strong> We shall not direct targeted advertisements or marketing communications to children or use their data to curate personalized commercial content.</li>
                    <li><strong>Detrimental Processing:</strong> We shall not engage in data processing likely to cause psychological or physical harm to a child.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 7: How We Use Information */}
            <section id="usage" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                7. How We Use Your Information
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <p>We process your personal data for the following essential purposes:</p>
                <ul className="list-decimal list-inside space-y-2 pl-2 text-gray-400">
                  <li><strong className="text-white">Provision of Services:</strong> Creating and maintaining user accounts, processing registrations for competitions, and verifying eligibility criteria.</li>
                  <li><strong className="text-white">Portfolio Development &amp; Matching:</strong> Constructing portfolios showcasing academic/technical skills and matching participants with sponsors or recruiters.</li>
                  <li><strong className="text-white">Communication:</strong> Sending administrative updates, security alerts, and event notifications.</li>
                  <li><strong className="text-white">Optimization &amp; Analytics:</strong> Monitoring performance, troubleshooting software bugs, and conducting data analysis to improve user experience.</li>
                  <li><strong className="text-white">Safety &amp; Fraud Prevention:</strong> Detecting, preventing, and mitigating fraudulent activities, security breaches, or policy violations.</li>
                  <li><strong className="text-white">Legal &amp; Regulatory Compliance:</strong> Complying with regulatory audits, tax guidelines, or orders from statutory authorities in India.</li>
                </ul>
              </div>
            </section>

            {/* Section 8: How We Share Information */}
            <section id="sharing" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                8. How We Share Your Information
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">8.1 Service Providers and Data Processors</h4>
                  <p>We may engage third-party &quot;Data Processors&quot; contractually bound to process your personal data only under our documented instructions and in accordance with the DPDPA, ensuring robust security safeguards.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">8.2 Event Sponsors and Organizers</h4>
                  <p>We share Professional and Identity Data with event sponsors and partner organizations to facilitate registration, participation, and potential recruitment/mentorship opportunities for events you voluntarily enter.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">8.3 Legal Disclosures</h4>
                  <p>We may disclose your personal data if required to do so by law or in good faith belief that such action is necessary to comply with legal obligations or orders from the Data Protection Board of India or courts in Ernakulam, Kerala.</p>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">8.4 Non-Disclosure</h4>
                  <p>Except as provided herein, Lenient Tree does not sell, rent, or trade your personal data to third parties for marketing or commercial purposes without your explicit affirmative consent.</p>
                </div>
              </div>
            </section>

            {/* Section 9: Cookies & Tracking */}
            <section id="cookies" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                9. Cookies and Other Tracking Technologies
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <p>
                  Lenient Tree uses cookies, web beacons, pixel tags, and similar technologies to collect information automatically. These are employed to enhance user experience, analyze website traffic, and ensure infrastructure security.
                </p>
                <div className="bg-white/5 p-5 rounded-2xl border border-[#022f2e]/40 mt-4">
                  <h4 className="text-white font-bold text-base mb-2">Categories of Cookies:</h4>
                  <ul className="space-y-2 text-gray-400">
                    <li><strong className="text-white">Strictly Necessary:</strong> Essential for site operations, authentication, and security protocols. Cannot be disabled.</li>
                    <li><strong className="text-white">Analytical &amp; Performance:</strong> Monitor performance, analyze traffic, and identify technical issues. Disabled by default unless consent is given.</li>
                    <li><strong className="text-white">Functional:</strong> Remember preferences, professional skills, or previous competition entries.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 10: Data Principal Rights */}
            <section id="rights" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                10. Data Principal Rights (DPDPA Sections 11-14)
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <p>Pursuant to the Act, you have the following rights as a Data Principal:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="border border-white/10 p-4 rounded-xl">
                    <h5 className="text-[#00ff88] font-bold text-sm">Right to Access</h5>
                    <p className="text-xs text-gray-400 mt-1">Obtain a summary of personal data being processed, processing activities, and identities of Data Fiduciaries/Processors with whom it was shared.</p>
                  </div>
                  <div className="border border-white/10 p-4 rounded-xl">
                    <h5 className="text-[#00ff88] font-bold text-sm">Right to Correction &amp; Erasure</h5>
                    <p className="text-xs text-gray-400 mt-1">Request correction of inaccurate or misleading data, completion of incomplete data, or erasure of data when consent is withdrawn or purpose is served.</p>
                  </div>
                  <div className="border border-white/10 p-4 rounded-xl">
                    <h5 className="text-[#00ff88] font-bold text-sm">Right of Grievance Redressal</h5>
                    <p className="text-xs text-gray-400 mt-1">Have readily available means of resolving complaints. You must exhaust internal grievance mechanisms before approaching the Data Protection Board.</p>
                  </div>
                  <div className="border border-white/10 p-4 rounded-xl">
                    <h5 className="text-[#00ff88] font-bold text-sm">Right to Nominate</h5>
                    <p className="text-xs text-gray-400 mt-1">Nominate another individual to exercise these rights on your behalf in the event of death or incapacity.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 11: Security & Breach */}
            <section id="security" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                11. Data Security and Breach Notification
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <p>
                  We implement reasonable technical and organizational measures to protect your digital personal data, including AES-256 encryption at rest, SSL/TLS during transmission, and strict role-based access control (RBAC).
                </p>
                <p>
                  In the event of a personal data breach, Lenient Tree shall promptly notify the Data Protection Board of India and the affected Data Principals with details regarding the breach and remedial steps being taken.
                </p>
              </div>
            </section>

            {/* Section 12: Retention & Erasure */}
            <section id="retention" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                12. Data Retention and Erasure
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <p>
                  Lenient Tree shall retain your digital personal data only for the duration necessary to fulfill the specific purposes outlined or as required by applicable laws in India.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-400 text-sm pl-2">
                  <li>For event or competition data, retention ceases once the event concludes and related portfolios/sponsor matching are completed.</li>
                  <li>Accounts inactive for a period exceeding three (3) years will be slated for erasure.</li>
                  <li>Erasure is carried out securely, rendering digital records irrecoverable.</li>
                </ul>
              </div>
            </section>

            {/* Section 13: Third-Party Services */}
            <section id="third-party" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                13. Third-Party Websites and Services
              </h3>
              <p className="text-sm sm:text-base">
                The Website may contain links to external sites or platforms. Lenient Tree does not control and is not responsible for the privacy practices or content of third-party websites. Users are advised to review terms of every third-party site they visit.
              </p>
            </section>

            {/* Section 14: International Transfers */}
            <section id="international" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                14. International Data Transfers
              </h3>
              <p className="text-sm sm:text-base">
                Lenient Tree may transfer personal data outside India, provided such transfers strictly adhere to Section 16 of the Act (complying with negative lists) and ensure comparable levels of protection through legally binding contracts.
              </p>
            </section>

            {/* Section 15: Policy Changes */}
            <section id="changes" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                15. Changes to This Privacy Policy
              </h3>
              <p className="text-sm sm:text-base">
                Lenient Tree reserves the right to modify this Policy at any time. Substantial changes (altering purpose or category of data processed) will be communicated via prominent site announcements, user dashboards, or direct email, and fresh consent will be sought if legally required.
              </p>
            </section>

            {/* Section 16: Governing Law */}
            <section id="governing-law" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                16. Governing Law and Jurisdiction
              </h3>
              <p className="text-sm sm:text-base">
                This Privacy Policy is governed by the laws of India. Any disputes arising out of this Policy are subject to the exclusive jurisdiction of the competent courts in Ernakulam, Kerala, India.
              </p>
            </section>

            {/* Section 17: Dispute Resolution */}
            <section id="dispute-resolution" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                17. Dispute Resolution
              </h3>
              <p className="text-sm sm:text-base">
                Any dispute, claim, or controversy shall first be resolved through amicable discussions and internal grievance mechanisms. If unresolved within thirty (30) days, the Data Principal may approach the Data Protection Board of India or proceed to mediation and arbitration in Ernakulam, Kerala, under the Arbitration and Conciliation Act, 1996.
              </p>
            </section>

            {/* Section 18: Grievance Redressal & DPO */}
            <section id="grievance-dpo" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                18. Grievance Redressal &amp; Data Protection Officer (DPO)
              </h3>
              <div className="space-y-6 text-sm sm:text-base">
                <p>
                  For queries, concerns, or complaints regarding the processing of your digital personal data, you may contact our designated Grievance / Data Protection Officer:
                </p>
                <div className="bg-[#022f2e]/10 border border-white/10 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-gray-400 block mb-1">Officer Name</span>
                      <span className="text-white font-bold text-lg">Mr Augustine Vadakumchery</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block mb-1">Designation</span>
                      <span className="text-white font-semibold">Data Protection Officer / Grievance Officer</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-[#00ff88] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs text-gray-400 block">E-mail Address</span>
                        <a href="mailto:dpo@lenienttree.com" className="text-white font-semibold hover:text-[#00ff88] transition-colors">
                          dpo@lenienttree.com
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#00ff88] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs text-gray-400 block">Postal Address</span>
                        <span className="text-white font-medium block leading-relaxed">
                          Lenient Tree, Vadakumchery,<br />
                          Anappara, Thuravoor Village,<br />
                          Manjapra, Ernakulam, Kerala 683581
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 19: Notices */}
            <section id="notices" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                19. Notices
              </h3>
              <p className="text-sm sm:text-base">
                All communications required under the Act shall be in writing and delivered electronically to the primary email or phone number registered. Notices to Lenient Tree must be directed in writing to the DPO contact details specified in Section 18.
              </p>
            </section>

            {/* Effective Date & Acceptance */}
            <section id="effective-date" className="scroll-mt-28 bg-white/5 border border-white/5 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                Effective Date and Acceptance
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                <p>
                  This Privacy Policy is effective as of <strong>May 28, 2026</strong>, and supersedes all prior versions.
                </p>
                <p>
                  By accessing, registering on, or using the website located at <a href="https://www.lenienttree.com/" className="text-[#00ff88] hover:underline">www.lenienttree.com</a>, you signify your formal acknowledgement and click-wrap consent to the processing of your digital personal data by Lenient Tree in its capacity as a Data Fiduciary.
                </p>
                <p className="text-gray-400 text-xs italic">
                  If you represent a minor, your acceptance implies verifiable parent/guardian consent as mandated under Section 9 of the Act. If you do not agree to these terms, you must cease use of the Website immediately.
                </p>
              </div>
            </section>

          </main>
        </div>
      </div>

      {/* Modern footer spacing */}
      <div className="border-t border-white/10 py-8 text-center text-xs text-gray-500 bg-[#060e0e]">
        <p>© 2026 The Lenient Tree. All rights reserved. Subject to the jurisdiction of courts in Ernakulam, Kerala.</p>
      </div>
    </div>
  );
}
