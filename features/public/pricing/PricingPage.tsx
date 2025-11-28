import React from 'react';
import { Helmet } from 'react-helmet-async';

export const PricingPage: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#c0c0c0', minHeight: '100vh', fontFamily: 'Times New Roman, serif' }}>
      <Helmet>
        <title>Pricing | SilverTech Directory</title>
        <meta name="description" content="Provider pricing for SilverTech Directory. Transparent, commission-free senior living marketing tools." />
      </Helmet>

      <div style={{ width: '800px', margin: '0 auto', padding: '20px', backgroundColor: '#ffffff', border: '2px solid #000000' }}>
        
        {/* Header */}
        <center>
          <font size="6"><b>SilverTech Directory Pricing</b></font>
        </center>
        <hr size="2" width="100%" color="#000000" />
        <br />

        {/* Intro Section */}
        <font size="3">
          <p>
            SilverTech Directory is completely free for families.<br />
            Every senior living community in the country receives a basic listing at no cost.
          </p>
          <p>
            We believe eldercare should be transparent and searchable, without forcing families into sales funnels or commission-based systems.
          </p>
          <p>
            Communities may upgrade their listings only if they want additional visibility or operational tools. Upgrades never affect how families use the site. They simply give providers optional advantages: photos, analytics, lead protection, and AI-assisted call handling.
          </p>
          <p>
            Below are the optional provider tools available.
          </p>
        </font>
        <br />
        <hr size="1" width="100%" color="#808080" />
        <br />

        {/* Pricing Table */}
        <center>
          <table border={1} cellPadding={10} cellSpacing={0} width="100%" style={{ borderCollapse: 'collapse', borderColor: '#000000' }}>
            <thead>
              <tr bgcolor="#e0e0e0">
                <th width="33%"><font size="4">Basic Listing</font><br /><font size="2">(Free)</font></th>
                <th width="33%"><font size="4">Featured Listing</font><br /><font size="2">($99/mo)</font></th>
                <th width="33%"><font size="4">Lead Capture Suite</font><br /><font size="2">($499/mo)</font></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td align="center">Included in directory</td>
                <td align="center">Included in directory</td>
                <td align="center">Included in directory</td>
              </tr>
              <tr>
                <td align="center">–</td>
                <td align="center">Placement priority</td>
                <td align="center">Placement priority</td>
              </tr>
              <tr>
                <td align="center">–</td>
                <td align="center">Photos allowed</td>
                <td align="center">Photos allowed</td>
              </tr>
              <tr>
                <td align="center">–</td>
                <td align="center">Pricing transparency badge</td>
                <td align="center">Pricing transparency badge</td>
              </tr>
              <tr>
                <td align="center">–</td>
                <td align="center">Schedule-a-Tour button</td>
                <td align="center">Schedule-a-Tour button</td>
              </tr>
              <tr>
                <td align="center">–</td>
                <td align="center">–</td>
                <td align="center">Dedicated lead email</td>
              </tr>
              <tr>
                <td align="center">–</td>
                <td align="center">–</td>
                <td align="center">Missed-call protection</td>
              </tr>
              <tr>
                <td align="center">–</td>
                <td align="center">–</td>
                <td align="center">AI call transcription</td>
              </tr>
              <tr>
                <td align="center">–</td>
                <td align="center">–</td>
                <td align="center">Lead scoring</td>
              </tr>
              <tr>
                <td align="center">–</td>
                <td align="center">–</td>
                <td align="center">Monthly PDF report</td>
              </tr>
              <tr>
                <td align="center">–</td>
                <td align="center">–</td>
                <td align="center">Virtual tour embed</td>
              </tr>
              <tr>
                <td align="center">–</td>
                <td align="center">Priority support</td>
                <td align="center">Priority support</td>
              </tr>
              {/* Buttons Row */}
              <tr bgcolor="#f0f0f0">
                <td align="center" style={{ paddingTop: '15px', paddingBottom: '15px' }}>
                  <input type="button" value="Get Started" />
                </td>
                <td align="center" style={{ paddingTop: '15px', paddingBottom: '15px' }}>
                  <input type="button" value="Get Started" />
                </td>
                <td align="center" style={{ paddingTop: '15px', paddingBottom: '15px' }}>
                  <input type="button" value="Get Started" />
                </td>
              </tr>
            </tbody>
          </table>
        </center>
        
        <br />
        <br />
        <center>
          <font size="2" color="#808080">
            &copy; 1996 SilverTech Directory. All rights reserved.
          </font>
        </center>
      </div>
    </div>
  );
};
