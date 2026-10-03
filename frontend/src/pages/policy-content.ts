export type PolicyClause = {
  num: string
  text: string
  items?: string[]
}

export type PolicySection = {
  id: string
  title: string
  clauses: PolicyClause[]
}

export type PolicyGroup = {
  slug: PolicyDocSlug
  title: string
  effectiveDate: string
  sections: PolicySection[]
}

export const POLICY_DOC_TITLES = {
  terms: 'Terms of Services',
  privacy: 'Privacy Policy',
} as const

export type PolicyDocSlug = keyof typeof POLICY_DOC_TITLES

export const POLICY_DOC_SLUGS = Object.keys(POLICY_DOC_TITLES) as PolicyDocSlug[]

export function isPolicyDocSlug(value: string | undefined): value is PolicyDocSlug {
  return value !== undefined && value in POLICY_DOC_TITLES
}

const EFFECTIVE_DATE = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date())

function termsSections(): PolicySection[] {
  return [
    {
      id: 'terms-section-1',
      title: 'Introduction',
      clauses: [
        {
          num: '1.1',
          text:
            'These Terms of Services ("Terms") govern your access to and use of the website www.relaive.com.au and the AI-powered property valuation service provided by Relaive (the "Services").',
        },
        {
          num: '1.2',
          text:
            'Relaive is an academic project (CSIT321, University of Wollongong) and is not currently operated by a commercial legal entity. "Relaive", "we" and "us" refer to the project team.',
        },
        {
          num: '1.3',
          text:
            'By using the Services, you agree to these Terms. If you do not agree, please stop using the Services.',
        },
        {
          num: '1.4',
          text: 'Please read these Terms together with our Privacy Policy.',
        },
      ],
    },
    {
      id: 'terms-section-2',
      title: 'Our Services',
      clauses: [
        {
          num: '2.1',
          text: 'Relaive generates estimated property valuation reports through a step-by-step workflow:',
          items: [
            'Step 1, Property Details: you enter the address, suburb, state, postcode, property type, land size and number of rooms.',
            'Step 2, Comparable Sales: the system automatically finds similar properties for comparison.',
            'Step 3, Market Intelligence: the system compiles market information.',
            'Step 4, ROI Analysis: you enter the relevant fees so that we can analyse investment returns. This step applies only to the Buyer and Investor roles.',
            'Step 5, Report Type: the report type is fixed according to your role.',
            'Step 6, Generate Report: the report is generated, and you may send it by email to an address you enter.',
          ],
        },
        {
          num: '2.2',
          text:
            'For all other roles, the workflow does not include ROI Analysis, so Report Type is Step 4 and Generate Report is Step 5.',
        },
        {
          num: '2.3',
          text: 'We may change, suspend or discontinue any part of the Services at any time.',
        },
      ],
    },
    {
      id: 'terms-section-3',
      title: 'Valuation Results and No Advice',
      clauses: [
        {
          num: '3.1',
          text:
            'Reports are automated estimates. They are not a formal valuation by a licensed valuer, and they are not financial, legal, tax or investment advice. ROI Analysis results are also estimates based on the data and assumptions available at the time of analysis, and they do not guarantee any profit or investment outcome.',
        },
        {
          num: '3.2',
          text:
            'The accuracy of a report depends on the information you provide and the market data available when the report is generated. Results may differ from actual sale prices.',
        },
        {
          num: '3.3',
          text:
            'You should seek independent professional advice before making any decision based on a report.',
        },
      ],
    },
    {
      id: 'terms-section-4',
      title: 'Accounts and Roles',
      clauses: [
        {
          num: '4.1',
          text:
            'You must provide accurate information, keep your login details secure and take responsibility for all activity under your account.',
        },
        {
          num: '4.2',
          text: 'The report types available to you depend on your account role.',
        },
      ],
    },
    {
      id: 'terms-section-5',
      title: 'Plans and Payment',
      clauses: [
        {
          num: '5.1',
          text: 'The Services offer three plans, billed monthly or annually (annual billing is discounted by 20%):',
          items: [
            'Free: 5 reports per month.',
            'Plus: AUD 79 per month, 50 reports per month.',
            'Pro: AUD 129 per month, 100 reports per month.',
          ],
        },
        {
          num: '5.2',
          text:
            'The Services are currently in a trial period and are free of charge. Payment functionality is not yet active. When it launches, we will announce it on the website.',
        },
        {
          num: '5.3',
          text:
            'When payments are introduced, transactions will be processed by a third-party provider (expected to be PayPal). We do not store your full payment card details.',
        },
        {
          num: '5.4',
          text:
            'Fees paid are non-refundable, except where required by law (including the Australian Consumer Law).',
        },
      ],
    },
    {
      id: 'terms-section-6',
      title: 'Acceptable Use',
      clauses: [
        {
          num: '6.1',
          text: 'You must not:',
          items: [
            'use the Services for any unlawful or fraudulent purpose;',
            'enter false, misleading or unauthorised information;',
            'copy, bulk-collect data from, or reverse engineer the system and its models;',
            'overload the Services or interfere with their security; or',
            'resell reports without our written consent.',
          ],
        },
      ],
    },
    {
      id: 'terms-section-7',
      title: 'Sharing Reports by Email',
      clauses: [
        {
          num: '7.1',
          text:
            'When you send a report to another person, you confirm that you are entitled to share that content and that you will not use this feature to send spam or unauthorised content.',
        },
        {
          num: '7.2',
          text: 'You are responsible for the email address you enter and the content you send.',
        },
      ],
    },
    {
      id: 'terms-section-8',
      title: 'Intellectual Property',
      clauses: [
        {
          num: '8.1',
          text: 'The website, software, models and branding belong to Relaive.',
        },
        {
          num: '8.2',
          text:
            'We grant you a limited, non-exclusive right to use reports for your personal or internal purposes.',
        },
        {
          num: '8.3',
          text:
            'You retain ownership of the information you enter, and you allow us to use it to operate the Services in accordance with our Privacy Policy.',
        },
      ],
    },
    {
      id: 'terms-section-9',
      title: 'Third-Party Data and Services',
      clauses: [
        {
          num: '9.1',
          text:
            'Sales and market data may come from third parties. We do not guarantee the accuracy, completeness or availability of that data.',
        },
      ],
    },
    {
      id: 'terms-section-10',
      title: 'Disclaimers and Limitation of Liability',
      clauses: [
        {
          num: '10.1',
          text:
            'Nothing in these Terms excludes any right you have under the Australian Consumer Law that cannot be excluded by law.',
        },
        {
          num: '10.2',
          text:
            'To the extent permitted by law, the Services are provided "as is", and we are not liable for indirect or consequential loss.',
        },
      ],
    },
    {
      id: 'terms-section-11',
      title: 'Suspension and Termination',
      clauses: [
        {
          num: '11.1',
          text:
            'We may suspend or terminate your access if you breach these Terms. You may stop using the Services and close your account at any time.',
        },
      ],
    },
    {
      id: 'terms-section-12',
      title: 'Changes to these Terms',
      clauses: [
        {
          num: '12.1',
          text:
            'We may update these Terms. The updated version will be posted on this page with a new effective date. Continued use of the Services means you accept the updated Terms.',
        },
      ],
    },
    {
      id: 'terms-section-13',
      title: 'Governing Law',
      clauses: [
        {
          num: '13.1',
          text: 'These Terms are governed by the laws of New South Wales, Australia.',
        },
      ],
    },
    {
      id: 'terms-section-14',
      title: 'Contact Us',
      clauses: [
        {
          num: '14.1',
          text:
            'Email: relaive.ai@gmail.com. Relaive project team (Group 25, CSIT321), University of Wollongong.',
        },
      ],
    },
  ]
}

function privacySections(): PolicySection[] {
  return [
    {
      id: 'privacy-section-1',
      title: 'Introduction',
      clauses: [
        {
          num: '1.1',
          text:
            'This Privacy Policy explains how Relaive collects, uses, discloses and protects your personal information when you use www.relaive.com.au.',
        },
        {
          num: '1.2',
          text:
            'We handle personal information in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles.',
        },
        {
          num: '1.3',
          text: 'Please read this Privacy Policy together with our Terms of Services.',
        },
      ],
    },
    {
      id: 'privacy-section-2',
      title: 'Information We Collect',
      clauses: [
        {
          num: '2.1',
          text: 'We collect the following information:',
          items: [
            'Account information: your name, email address and role.',
            'Property information you enter in Step 1: address, suburb, state, postcode, property type, land size and number of rooms.',
            'Financial information you enter in the ROI Analysis step (for Buyer and Investor roles): fees related to the property. This information is used only to calculate and display the ROI results in your report.',
            'Report recipient information: the email address you enter to send a report.',
            'Payment information: when payments launch, they will be processed by a third-party provider (expected to be PayPal); we do not store your full card details.',
            'Technical data: IP address, device type and browser type, recorded in system logs.',
            'Messages you send to us.',
          ],
        },
      ],
    },
    {
      id: 'privacy-section-3',
      title: 'How We Collect Information',
      clauses: [
        {
          num: '3.1',
          text:
            'Directly from you when you register, enter information through the workflow steps, send a report or contact us.',
        },
        {
          num: '3.2',
          text: 'Automatically, through technical data recorded when you access the Services.',
        },
        {
          num: '3.3',
          text:
            'From third-party data sources used to find comparable sales and analyse the market (Steps 2 and 3).',
        },
      ],
    },
    {
      id: 'privacy-section-4',
      title: 'How We Use Your Information',
      clauses: [
        {
          num: '4.1',
          text: 'We use your information to:',
          items: [
            'generate valuation reports, including finding comparable properties, compiling market information and, for Buyer and Investor roles, analysing ROI;',
            'create and manage accounts, roles and plan report limits;',
            'send reports by email at your request;',
            'communicate with you about the Services, support and updates;',
            'protect security and prevent fraud and misuse; and',
            'comply with our legal obligations.',
          ],
        },
      ],
    },
    {
      id: 'privacy-section-5',
      title: 'AI and Automated Processing',
      clauses: [
        {
          num: '5.1',
          text:
            'The information you enter is processed by AI models to produce valuation estimates. Results are generated automatically, are not reviewed by a person and are not a formal valuation.',
        },
        {
          num: '5.2',
          text: 'We do not sell your personal information.',
        },
      ],
    },
    {
      id: 'privacy-section-6',
      title: 'Disclosure of Information',
      clauses: [
        {
          num: '6.1',
          text:
            'We may share information with service providers that help us operate the Services (hosting, email delivery and payment) and where required by law.',
        },
        {
          num: '6.2',
          text:
            'Reports and recipient email addresses are used only to send reports at your request.',
        },
        {
          num: '6.3',
          text:
            'Some providers may store or process data outside Australia. Where this happens, we take reasonable steps to ensure the data is protected in line with the Australian Privacy Principles.',
        },
      ],
    },
    {
      id: 'privacy-section-7',
      title: 'Cookies',
      clauses: [
        {
          num: '7.1',
          text: 'Relaive does not currently use cookies or similar tracking technologies.',
        },
        {
          num: '7.2',
          text: 'If we start using them in the future, this policy will be updated.',
        },
      ],
    },
    {
      id: 'privacy-section-8',
      title: 'Security and Retention',
      clauses: [
        {
          num: '8.1',
          text:
            'We take reasonable steps to protect information from unauthorised access, loss and misuse.',
        },
        {
          num: '8.2',
          text:
            'We keep information only while it is needed for the purposes described above or as required by law. After that, it is deleted or de-identified.',
        },
      ],
    },
    {
      id: 'privacy-section-9',
      title: 'Your Rights',
      clauses: [
        {
          num: '9.1',
          text:
            'You may request access to, and correction of, the personal information we hold about you.',
        },
        {
          num: '9.2',
          text:
            'Send your request to relaive.ai@gmail.com. We will respond within a reasonable time and may need to verify your identity.',
        },
      ],
    },
    {
      id: 'privacy-section-10',
      title: 'Complaints',
      clauses: [
        {
          num: '10.1',
          text:
            'If you believe we have breached the Australian Privacy Principles, please contact us first.',
        },
        {
          num: '10.2',
          text:
            'If you are not satisfied with our response, you may complain to the Office of the Australian Information Commissioner (OAIC) at www.oaic.gov.au.',
        },
      ],
    },
    {
      id: 'privacy-section-11',
      title: 'Changes to this Policy',
      clauses: [
        {
          num: '11.1',
          text:
            'We may update this policy. The updated version will be posted on this page with a new effective date.',
        },
      ],
    },
    {
      id: 'privacy-section-12',
      title: 'Contact Us',
      clauses: [
        {
          num: '12.1',
          text:
            'Email: relaive.ai@gmail.com. Relaive project team (Group 25, CSIT321), University of Wollongong.',
        },
      ],
    },
  ]
}

export const POLICY_GROUPS: PolicyGroup[] = [
  {
    slug: 'terms',
    title: POLICY_DOC_TITLES.terms,
    effectiveDate: EFFECTIVE_DATE,
    sections: termsSections(),
  },
  {
    slug: 'privacy',
    title: POLICY_DOC_TITLES.privacy,
    effectiveDate: EFFECTIVE_DATE,
    sections: privacySections(),
  },
]

export function sectionMatchesQuery(section: PolicySection, q: string): boolean {
  if (section.title.toLowerCase().includes(q)) return true
  return section.clauses.some(
    (clause) =>
      clause.text.toLowerCase().includes(q) ||
      clause.items?.some((item) => item.toLowerCase().includes(q)),
  )
}
