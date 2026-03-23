UI Layer: Streamlit frontend takes Fund Codes or Portfolio JSON.
Orchestrator: CrewAI manages the state and handoffs between agents .
Specialized Agents:Data Scout: Pulls daily NAV from AMFI via mftool .
Signal Analyst: Uses Serper API to hunt for regulatory shocks like "Joint Taxation".
Risk Strategist: Calculates XIRR where $XNPV = \sum_{i=0}^{n} \frac{P_i}{(1+r)^{(d_i-d_0)/365}} = 0$ .
