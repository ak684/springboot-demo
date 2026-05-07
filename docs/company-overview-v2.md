# Company Overview V2

## Overview

A new public company profile page based on the WISTA 3.1 Figma designs. This page displays company information in a visually rich format, initially targeting the Ukrainian portfolio companies.

**PR:** #375
**Branch:** `claude/company-overview-v2-66yJc`
**Routes:** `/company-overview` (sample data), `/company-overview/:companyId` (API data)
**Preview:** https://venture-impact-platform-pr-375.onrender.com/company-overview

## Current State

### Completed
- Visual implementation matching Figma design (WISTA 3.1 "Unverified" variant)
- Sample data showing Nosh Biofoods GmbH as example
- Basic API integration scaffolding (falls back to sample data)
- All major sections implemented:
  - Navigation header with WISTA branding
  - Breadcrumb navigation
  - Company header with name, industry tags, unverified badge
  - Logo + description card with address/website
  - Profile activity trending indicator
  - CEO/Founders row with legal form, formation date, employee count
  - "What we do" products/services table
  - Recent news grid with social platform indicators
  - Social media CTA section
  - Blog posts grid
  - SDG contributions with progress bars
  - Certifications and awards
  - Contact section
  - Footer

### Visual Details
- Light grey page background (`#f9fafb`)
- White rounded cards (`borderRadius: 16px`) for content sections
- Purple/pink gradient on UNVERIFIED badge
- Green-to-teal gradient on trending bar (16px height)
- Icon boxes use `#f6f8ec` background (measured from Figma)
- Small info icons (18px) with purple gradient
- Bold address and website text

## Next Steps

### Phase 1: Data Integration
1. **API Endpoint** - Create or extend `/companies/profile/:id` endpoint to return all needed fields
2. **Field Mapping** - Map `CompanyExtractionData` fields to the UI:
   - `company_name`, `company_logo`, `company_description`
   - `headquarter_address`, `company_url`
   - `industry_sectors` (needs parsing from comma-separated string)
   - `ceo_name`, `legal_form`, `legal_entity_formation_date`, `number_of_employees`
   - `core_products_services` (JSON field)
3. **News/Social Data** - Determine source for recent news (may need new extraction phase or external API)
4. **SDG Data** - Connect to existing SDG/impact measurement data

### Phase 2: Ukrainian Portfolio
1. Create portfolio landing page listing all 13 companies (portfolio ID 70)
2. Link each company to its `/company-overview/:companyId` page
3. Test with real Ukrainian company data

### Phase 3: Verification Status
1. Support "Verified" variant (different badge styling)
2. Allow companies to claim/verify their profiles
3. Add edit capabilities for verified companies

## Technical Details

### File Location
```
frontend/shared-components/views/pages/companyOverviewV2/CompanyOverviewV2.js
```

### Routes (in router.js)
```javascript
<Route path='/company-overview' element={<CompanyOverviewV2 />} />
<Route path='/company-overview/:companyId' element={<CompanyOverviewV2 />} />
```

### Data Structure
The component expects data in this shape (see `SAMPLE_DATA` in component):
```javascript
{
  company_name: string,
  company_logo: string,
  company_description: string,
  headquarter_address: string,
  company_url: string,
  industry_sectors: string[],
  ceo_name: string,
  legal_form: string,
  legal_entity_formation_date: string,
  number_of_employees: string,
  core_products_services: {
    category_title: string,
    items: [{ title: string, description: string }]
  },
  recent_news: [{ title, date, source, platform, image, tags }],
  blog_posts: [{ title, description, link, image, tag }],
  sdg_contributions: [{ sdg: number, label, percentage, color }],
  certifications: [{ name, description, link }],
  social_media_links: { facebook, twitter, linkedin },
  contact_email: string
}
```

### Ukrainian Portfolio
- Portfolio ID: 70
- Company count: 13 companies
- Source: Company URL extractor
- Query (uses join table):
  ```sql
  SELECT c.id, c.company_name, c.company_url
  FROM company_extraction_data c
  JOIN portfolio_company_extraction_access pca ON c.id = pca.company_extraction_data_id
  WHERE pca.portfolio_id = 70
  ORDER BY c.company_name
  ```
- Example public profile URL: `https://app.impactforesight.io/company-overview/{companyId}`
  - Production: `https://app.impactforesight.io/company-overview/535`
  - Local dev: `http://localhost:9000/company-overview/535`

## References
- Figma assets: `docs/wista-whitelabel/figma-designs/wista-3.1-company-overview-Unverified.png`
- Original call transcript: Discussed creating public profile page for WISTA companies
- Existing public profile: `VenturePublicProfile.js` (different design, for ventures)

## APPENDIX

### Original User Prompt For This Workstream
Ok so I just got off a call with my boss for this project Ingo and honestly the call was a bit long and windy but I believe it landed in a place where I should implement a new company overview page.. I think i might want to implement this as a 'v2' of the public-profile page? but im not quite sure.. and i think for now the most important part is just to implement it visually first.. and in a way that would make it easy to hook up our other company data into later when we eventually use this page in other parts of our app as ingo talks about in this video call transcript. For reference I'm including the transcript and then also a slack message ingo recently posted where he basically says that right now we can work on implementing step a, which would be to implement a page in the app that looks EXACTLY like the figma designs in the figma asset folder (all 4 files are the same design.. it's just 4 files so you can read whichever ones allow you to implement the webpage exactly as the designed ) it's for your convenience):

00:00 uh, creating a URL like the portfolio here that you see here, where basically, uh, you could send an email to all the VISTA companies and tell them we have a portfolio of companies from Ukraine that are interested to work with you.
00:21 And, um, my vision was, or just a use case that we could then have like you know these short profiles of these companies whether it's in this format where they can scroll through and see quickly what these do and then potentially also when you click on it that you see the more detailed company profile
00:48 where we already have the design which would basically be this this design here that we want to do anyways. It doesn't maybe need to be editable in the first iteration, but basically it would be like portfolio of companies where I could click on and then see what type of companies there are and see whether
01:19 you know I've interest to collaborate with them. In the future use case, not the immediate use I even thought, maybe you would then even have like for VISTA internal use portfolio where any VISTA company can add like a service provider company and then maybe give them a rating and say we're very satisfied
01:50 . So suppose you join the science park and you say, I need a developer. Basically, you could then, you know, click on on the link and see which companies already work with existing developer companies and if clients were happy, they would receive a good rating, which would be internal, like an internal
02:08 database. So that's another use case that I had and I'll discuss with them tomorrow what they need and how it should work but basically I think they don't have a large window between now and when they need to communicate this work document to the rest of the science park so I think there's a little bit
02:35 of time pressure so I don't think we have a month I think Helio mentioned it would be on. I would need to meet with him at the latest until the 11th, so maybe he'd want to share this on the 12th, which would be like Monday next week, but I can find out when I'm meeting tomorrow.
02:52 But basically, my question is, do you think it might be feasible to have some sort of link that we could share with the Vista Network, work where we have some sort of herd profile, whether it's something like this or you can also have it in our, there's a second version we could discuss.
03:21 You may also say it's not feasible, the second version we have is, excuse me a second, if we click here on public profile, certified ventures, but also have this visualization here, here that might even be nicer.
03:39 You know, you could leave away the summary. You could leave the portfolio level impact and the team. And, you know, we have this here, the Ukraine, and that in Bang Vista.
03:49 And then there are no headquarters shown here for, oh, good, there's no, maybe I have to add them first to just see how that works.
04:02 Maybe I'll use a different portfolio because I think that could be a nice visualization if I use a my portfolio.
04:14 So if I go to Vista and I'll get a foundation but Vista. Now we go on the public profile. certified impact ventures.
04:29 You can see now, I think only the five that were added. So this could be visualization. Basically, we create, like, you know, the portfolio would then be called, whether it's the Ukrainian companies, or we could call it in future service providers used by our community.
04:54 And then you would see the short profiles you could scroll through and if you want to click on it, then you would potentially see this profile here.
05:10 Although I admit we only have very little information about the actual company, what they do, the products and services and lot of you know, sustainability, topics, that might be less of interest for the VISTA community.
05:33 We could even imagine having, like, a simplified profile just showing this part here. maybe this part here when it was found that we were going to employees, the products, and then maybe a short AI generated description, and the rest would just skip it.
05:52 That could be an option. And yeah, so, and I think the use case is a way for them to share it.
06:03 And obviously, in next step, once we have our agent, you could imagine, you know, please find me a company that's well-arraded, that provides the following services, and then it screens through the Vista and Tramble companies, and it finds, so that's, you know, use case that we could think of.
06:28 So, the question is, do you think it's realistic to, we could even reuse the code as far as I'm not sure how much that adds value.
06:38 We were to say we'd use more or less this code here. Obviously you could leave away the summary, the portfolio level impact in the team, and then have these short profiles here.
06:52 to click on and maybe there could be like a search window where you could search for a developer or a service provider or something like this.
07:06 And if you click on it, it wouldn't make sense to have something completely new. I think you know, use what we need to develop anyways.
07:21 So we first part up until here of the company profile with maybe a short description below something like this.
07:34 So my question, if I meet them tomorrow and I tell them, you know, we could deliver this by Monday, do you think that something that could be feasible knowing that we need to provide it anyways?
07:48 Or do you think that's completely out of scope and and not possible. You can also tell me tomorrow, you can give first feedback and based on this, you know, I'll link the discussion tomorrow.
07:59 I like the idea because they have current use case. I like the future use case where they can just, you know, create this portfolio of service providers with the option to rate and rank and the option to search through, giving them agent.
08:16 So, I see a lot of potential and just like the fact that, you know, they see a use case and whatever they see when I want to cater it and make them see, oh yeah, great, that works.
08:29 Yeah, for sure. Yeah, so just, just so I'm understanding everything correctly, so is it, it seems like there might be two potential ideas or like, One of them is to use the public profile, we have in the main app and then display these companies, like have a public profile for the Ukrainian portfolio
08:57 and display the companies under it. We're doing right now for the premises and show this like FigmaS page or another possibility is the map showing this via the map, roughly.
09:15 Is that the rough ideas? So my vision would be to have both first, when you click on a link, you see the map with all the portfolio companies as a snapshot, like this similar to what we have here.
09:37 And then if you see, oh, okay, they provide, you know, whatever service I might be interested in, then I click on it and get, you know, the more detailed profile center to what we already have in this old app already.
09:58 So I think it might be able to reuse some code. However, I would suggest to rather use this format that we have here more or less so we can, you know, we don't reproduce everything in two or three different versions.
10:14 So first, an overview, and if I just think, you know, sharing the word document, where no one reads through, compared to sharing a link where you see a map with short profiles of these companies, I'm sorry, I'm just going back here, here we go, ventures.
10:43 Seeing in the map with the ventures and shortfall files, I can scroll through, it looks interesting. I get some more information, then I click on it and see a little bit more information.
10:53 That's just, it would be a way to make this work document more interesting, more easy to share with the clients.
11:05 And then the third use, the future use case would be that if I really collaborate with them or have interaction with them, that I can, you know, add a short rating and say, you know, very happy with the services, and it could potentially show up.
11:26 And this would be, however, an internal database that should not appear on Google or whatever. I think it's really an internal tool where it's value, and if you join the VISTA Science Park, you get access to this curated list of companies that providers that you could work with, with internal reviews
11:51 and so on. I'm not sure when they need it, but that's just some ideas that I had. Yeah, okay, and then I think I might recommend, or at least like for this, this is public profile.
12:14 So right now for the Ukrainian profile, for example, like they have a public profile already, right? Was that what we were just looking at?
12:23 But they're profile. They're profile for this like new Ukrainian portfolio that you made. Or you just made this in the company or with shocker, but there's no like public profile yet for this.
12:36 Correct, correct. So that is correct. So so far I could not share it with the Vista community. This basically you'd see the list of companies.
12:46 And if you click on it, there's a lot of information that might not be relevant for the VISTA community.
12:59 You know, they're not interested in their sustainability impact, and in all of these details, they would need sort of a more public profile where they get core information about their services, their size, since when they exist, and you know what they offer.
13:18 So I think they would more need, you know, this sort of a public profile feature here that describes what they do and then, you know, a way to reach out if I'm interested.
13:32 it. Um, and then this this page that we're looking at now, this been the page like what page would this like replace or like be a redesign for.
13:44 So this page here, but yeah, or like, or is this like a brand brand new page? Because I think you said there was another page that we have that maybe we could redesign into this page for like maybe I was so I think this is the design find that we chose so far for the future public profile.
14:08 Basically, once we have this public searchable database of all the VISTA companies, then once you click on the company detail, the public would get this information here.
14:26 And this is something that I suggest to build, although I find the design okay, but it's a little bit too detailed, not too small.
14:37 I would, like this text is really small. Maybe it's better like this. But still, we would certainly want to develop for each company, the public profile that is exactly, you know, this content and we have all of this information in our URL extractor already so it's just a matter of, you know, building
15:04 that page and the public profile and then connecting it with the data that we have about the company because everything is available in our product URL extractor and for this use case, the Ukrainian database, we do have an existing public profile in our old app that looks like this.
15:40 But it doesn't say so much about the company details. And here this is in fact details, the public doesn't care about it, impact the neighbors, the company doesn't care about it.
15:51 So basically, I don't think we should use this design from the old app. I think we should use this design here from the new app.
16:06 with the slight change that we could say let's not add to this page all the impact piece at this point in time because it's not necessarily relevant for the vista community and basically we could say let's just build you know this page from here to here, for example, with maybe some sort of one more
16:40 text description below this part. And so the product would consist of two pieces. You code that you see here a map with the URLs, the company headquarters, and the short profiles.
17:11 And then basically these 17 or 13 companies that we have the Vista database would appear in this format, and then basically we could share this link with the Vista community and tell them look here we have 13 companies from Ukraine are we interested to collaborate with them and they would see a nice
17:36 overview and they'd say oh yeah this looks interesting you could click on it and then they would get this information with you know what products do they offer And the benefit is that in any case, we want to develop this design for the public profile.
17:53 So basically, we just reuse, we need to develop this design anyways, as we want to have the public profile of all Vista companies in future.
18:13 So my take here is, I think that we can definitely, okay, so basically what I'm seeing here is in order to accomplish this, I would have to, or like we'd have to figure out how to get, or at least we have this, right?
18:40 We have like this kind of starting point, but like we kind of have to like mold this I think in some way that we, how we wanted to look, which I'm not sure if that means we remove things from this page, but then that might be reflected in like all the public profile, so then we'd have to like figure
19:03 out how to do that, but I make it look like we want and it might look like a different URL or something.
19:08 So I think there's a slight bit of discussion with that. And then we have this like new page which we don't currently have, which is like in the Figma that like I need to add to the app.
19:23 Exactly. And then we just have to make sure everything like looks and works okay. So I think there is definitely some level of complexity here simply because we don't actually have even though we have things in the app that are similar to what we want, we actually don't have exactly what we want created
19:44 yet like in the app. Right. And so I would need to like build that which I can definitely do, although I imagine there might be some back and forth, and there might be some tweaks.
19:58 So, if it were me and I were managing this relationship with VISTA, then I might not exactly promise, like, this is what I'm going to have built by Monday, or whatever, just because it's like, That doesn't necessarily seem to be a huge need to exactly promise that.
20:23 But what you might say is, yeah, we'll definitely have this shareable for you. And then do a surprise and delight, oh, we have this version as well.
20:33 Or just do something where maybe you under-promise and then over-delivered. But I think we can definitely build this out all over the week.
20:41 I just want to call out that, like, it doesn't exist really right now, so it's like we'd have to, like I want to do it in like a methodical way so that we can kind of like build it out in a way that's like as useful as possible, like within like a week.
20:59 That sounds really good. Does that make sense, yeah? Yes, that makes sense, and I think that sufficient information that I would need for the for the call tomorrow or the meeting tomorrow.
21:11 I'll just discuss and see what they want. And I can also see what are their deadlines. And, but yeah, I think that makes a lot of sense.
21:21 I like the idea because in any case, we need to build the public profiles. So it's sort of two things with a single action.
21:31 We could, you know, we need the public profiles. We could reuse them for, you know, sharing the Ukrainian companies and I'll find out what their deadlines are and what their interest is whether we have some ideas of different use cases but I see a lot of potential and especially once we have this agent
21:51 where then they can search internally for providers that are being used that's extremely helpful because you know you never know who to reach out to and if you get feedback from the internal community and then the database of companies where other companies collaborate with I would be very powerful,
22:06 you know, I would say, oh yeah, I want to join the Science Park. They have like good infrastructure. So I believe they might like it, but let me check out what they think tomorrow and then I'll reach out to you.
22:21 Yeah, yeah. And you know, you can even say things like, hey, like we're gonna work to make this as shareable as possible.
22:27 And that makes it clear that like you're gonna, you're gonna, as possible as you can, but it also gives you that grieving room to like how you're going to deliver that and then in the background, in the background I can be working on this right and we can be like working like over here but that way you
22:42 kind of like you don't you don't like promise something and then like we don't have anything built right now and then like we can't deliver it and then like maybe like lose a little bit of trust right and then you kind of say like yeah we'll make a turbo and then like next week it's like you know we
22:55 you know we have this version like is this helpful you know so anyway but yeah like I said I can definitely work on this throughout the week to build it out there's definitely several steps that are going to have to be built out to do this, and then we can work together on that, and then yeah, we can
23:13 just work together on that, and then yeah, like I said, if you can just kind of give yourself a little bit of slack on their side to like be like, hey, again, not promise the specific result, but just promise that it will be shareable, and then we can configure them back in and then set you up next Monday
23:29 to show whatever you want to show. That sounds good. That sounds great. I will make any promises. I'll just tell them, I'll see what I can do.
23:38 And also see, maybe this deadline doesn't really exist. And maybe the deadline is on Thursday. I don't have a clue, but he mentioned something about the length, I remember.
23:48 So I'll just find out. And in the meantime, as the next step, we'll have a call on Thursday, a little bit of an outlook and I wanted to do two things, you know, big picture, where did we had our like employment contracts, relationship, salary and collaboration, everything.
24:08 And the second part will also be very clear. Next steps, what do we need next? And I think we do have a lot of designs.
24:20 We have the agent as topics. I think it's just a question of prioritization. And then I think there will be quite a big chunk of work that's fairly well structured in terms of what we need.
24:35 So let's do this in Thursday. I haven't had the time to prepare. In the meantime, I think what you could do, even because maybe they say, you know, they need to share the Ukrainian companies by Thursday, and they'll just share the word document.
24:51 And then what we could do and what we will certainly need, what you could start working on is use the Figma design of the public profiles and start building out this design, you know, whether it's available on a public URL or an internally URL, we want to have these profiles.
25:16 Yeah, yeah. And so this is one thing that's a deliverable. It's high priority. I think we will also need it as a demo tool to other science parks.
25:28 Yeah. So it's in any case, it was high in the priority list and if you do want to work between now and tomorrow, I think I have a meeting with them at 2 p.m.
25:40 So my time Berlin time so basically you know by or maybe 10 a.m.
25:50 your time it can give you feedback but if you want to work between now and 10 a.m. tomorrow I would suggest start building out the public profile from the Vista design and I think we have several designs let me just share the right one with you.
26:09 We do that now, but I will take it. Yes, I think that's the one that we want to use. Obviously, the next step we also want to make this editable and I believe, do you say editable?
26:38 Is that something to eat or something to edit? Yeah. Editable is to eat, editable to edit. Correct. Yeah. Yeah, let's do it again.
26:47 You're right. Or it's the difference between these two profiles. Stop trying, try and try and do it. It's un-barified and here it's managed profile.
27:04 Yeah, I think so that's the two designs that we want to use, where you have here the un-barified, very clearly labeled and here it wants it's verified you can see like the verified version so that's the public profile and in terms of editing I think I told them to use this as let's just talk with this
27:47 and I'll share with you afterwards I'll share this now can you share both frames at the same time I can't do anything.
28:03 I'll try to be able to highlight something here. Maybe I'm not logged in to this thing. Typically, I'm always able to.
28:16 Maybe it's actually like login, it's probably like login, maybe. Okay, I'll just share it with you directly out the call.
28:32 I'll share the one that you should start building out and the second one where they have the design for how to edit it internally.
28:44 I'm not sure when it's relevant at this point in time, but just maybe that's also helpful to see it now.
28:52 And we should have the data for all of it maybe with some very little information that we don't and so that would be helpful and we can use it for Ukrainian companies potentially and we need it anyways.
29:12 Yeah, absolutely. Yeah, I think that's awesome. Yeah, like you said, I'll start working on this because we're going to need it regardless.
29:21 We don't have it and it's part of why. Yeah, it's just it's just it's just a part of the complication for like why I'm doing this and we kiss this unknown, right?
29:31 So like, I'll just like work on that to like de-risk that and then you can get more information and then, you know, we chat And then as well Thursday and then we kind of keep moving over there.
29:42 So I think we're productive Sounds good and um Part of the feedback that I will show Thursdays that I'm also very satisfied with the designs that you provide, although to the client, I remember some I said, you know, there's no design that's not fully designs.
30:04 If you feel like you want to change any of the designs here, feel free to do it. It doesn't need to be used as a basis.
30:18 And if you have some better ideas, feel free to implement it slightly differently. That's okay. Yeah, that sounds good. Yeah, I'll try to put up first draft, and then, you know, like always, it'll take a peek, give a feedback, and we'll keep it quick for later reading, and kind of go for that.
30:40 Okay, that's great. Yeah, so we have a short-term to do that you can work on whenever you find Right time to start working on it and I'll give you feedback tomorrow.
30:57 We have a call on Thursday, bigger picture. I think everything looks, the path is very, very clear what we need to deliver.
31:05 The meeting with Vista once again before Christmas went extremely well. I think they like the work that we do. And I think also on a personal basis, we just enjoy collaborating together.
31:17 So, you know, if we deliver, I think they'll share the science parks which could hugely increase our revenues and which could then, you know, increase, you know, be a first step into becoming profitable companies.
31:33 So if we deliver, I think things look very straightforward. So we need to work a little bit on our speed.
31:43 And if with that, then everything should be great. Okay, that's it for my end. For today was nice connecting and I'll be in touch with tomorrow then on Thursday.
32:01 That's good. Thanks for watching. We're continuing to collaborate. Wonderful. Thank you very much. Have a great rest of your day.

Ingo Michelfelder
Yesterday at 12:00 PM
Here the link to the public profile that we should generate for ALL tech related WISTA companies.
a.) Version unclaimed: https://www.figma.com/design/eEcRkalXksqhXfSanDLq7G/Impact-foresight-design?node-id=13391-25523&t=0mxXKe4l8XkzQHNT-4
b.) Version "claimed": https://www.figma.com/design/eEcRkalXksqhXfSanDLq7G/Impact-foresight-design?node-id=13404-20659&t=0mxXKe4l8XkzQHNT-4
As a preview, here we have the process how a company can claim and manage their profile: https://www.figma.com/design/eEcRkalXksqhXfSanDLq7G/Impact-foresight-design?node-id=13529-45593&t=0mxXKe4l8XkzQHNT-4
My thought was that we could create a.) above for the Ukrainian companies and also offer a link that we can share with all WISTA companies, that shows a searchable listing/database with short profiles of these companies, similar to the design here: https://app.impactforesight.io/public-profile/portfolios/70 or (with companies) https://app.impactforesight.io/public-profile/portfolios/1.
My suggestion would be to start building a.) above, as we will need it in any case... and I give you feedback about deadlines and use cases for the Ukrainian companies tomorrow AM your time. (edited)

So yea i think ultimately ingo wants this newly design page for the companies of the ukranian company portfolio he built with the company url extractor.. but i do not believe tat portfolio has been translated into a portfolio in the other non company url data extractor part of the app / db.. and so to fully complete what ingo is looking for.. we'd ned to do that as well and then link a final version of this new overview page to those companies in a public page for the ukranian portfolio.. at least that's my udnerstanding.. I need you to deeply research the code and feel free to read the db using the query endpoint or do anything you need to do via the exec endpoint.. also feel free to go to these public pages if you want or need (since they are public) and/or you can just read the code in our codebase. It'd be great if you can tell me what you believe is a good plan forward here to accomplishing this, and then finally if you can at least give me a page in the app I can show to Ingo as a first step that looks exactly like the 'company-overview' figma assests that would be incredible and a big win.. and then when you built it just keep in mind the overall plan for where we'll uultimately want to 'hook in' that page and what data from our db tables we might use to populate it (or what data we still need to fetch)

When you are done creating this page, please create a PR and then add a render preview so that I can see your work. Feel free to self-validate that your code changes work by building locally and testing apis if relevant. for local testing if you do end up testing apis, just use the login / auth approach since the sysadmin approach doesn't quite work just yet.. (but also dont feel the need to test apis if it's not actually relevant to what you build.. you need to verify you code works and looks exactly as the screenshot but do things that make sense)
