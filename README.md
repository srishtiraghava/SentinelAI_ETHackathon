
Sentinel AI: Proactive Agentic Research Desk for the Indian Investor
Sentinel AI is an autonomous multi-agent system designed to help India's 14 crore+ retail investors move from "reacting to tips" to making data-backed, institutional-grade decisions. Unlike standard financial chatbots that simply summarize data, Sentinel AI acts as an Organizational Brain, proactively hunting for "Alpha" signals and performing deep portfolio risk analysis.

Problem Statement Alignment
Most retail investors in India manage portfolios based on gut feel or lagging indicators. Sentinel AI addresses Problem Statement 6 by providing:

Signal-Finder Radar: Moving beyond summarization to identify real-time trends in SEBI filings and market news.

Portfolio X-Ray: Deterministic math engines to calculate true performance (XIRR) and identify concentration risks.

Explainable AI (XAI): Every recommendation is accompanied by an auditable chain of thought and cited sources.

System Architecture
Sentinel AI uses a Multi-Agent Orchestration framework (CrewAI) to decompose complex financial tasks into specialized roles.

Agent	Role	Responsibility
Market Scouter	Data Specialist	Retrieves live NAV from AMFI and stock prices from NSE using mftool and yfinance.
Signal Analyst	Market Strategist	
Analyzes market sentiment and SEBI filings using the SerperDevTool to find "Alpha".

Risk Strategist	Quantitative Analyst	Uses deterministic math to calculate XIRR and portfolio overlap.
Portfolio Reporter	Portfolio Manager	Synthesizes insights into a professional, source-cited report for the user.
 Tech Stack
Agent Framework: CrewAI (Multi-Agent Orchestration).

Brain (LLM): GPT-4o-mini (Financial Reasoning).

Live Data Sources: mftool (AMFI India), yfinance (NSE/BSE), Serper API (ET Markets News).

Math Engine: pyxirr for precise Extended Internal Rate of Return calculation.

Frontend: Streamlit (Proposed for interactive dashboard).

 Installation & Setup
Prerequisites
Python 3.10+

OpenAI API Key

Serper.dev API Key

Steps
Clone the repository:

Bash
git clone https://github.com/YOUR_USERNAME/SentinelAI_ETHackathon.git
cd SentinelAI_ETHackathon
Install dependencies:

Bash
pip install crewai crewai_tools mftool yfinance pyxirr langchain-openai
Configure Environment Variables:
Create a .env file and add:

Code snippet
OPENAI_API_KEY=your_key_here
SERPER_API_KEY=your_key_here
Run the Prototype:

Bash
python sentinel_main.py
 Unique Innovations
Proactive Signal Hunting: Instead of waiting for a query, the system continuously scans for liquidity warnings or management changes in SEBI documents.

Deterministic XIRR Logic: Combines the reasoning of LLMs with the precision of financial libraries to solve the XNPV=0 equation for SIP-based portfolios.

Multi-Modal Delivery: Capable of generating visual data summaries and structured reports rather than just plain text.



Team: Mighty Fighters
