import { getRandomTravelLocation, getTravelOptions } from '@/lib/travel-data';
import { createEmptyTravelSelections, type HierarchyLevel } from '@/data/geo-data';

function parseTargetLevel(value: string | null): HierarchyLevel {
  if (value === 'continent' || value === 'country' || value === 'region' || value === 'city') {
    return value;
  }

  return 'country';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');
  const targetLevel = parseTargetLevel(searchParams.get('targetLevel'));
  const selections = createEmptyTravelSelections();

  selections.continent = searchParams.getAll('continent');
  selections.country = searchParams.getAll('country');
  selections.region = searchParams.getAll('region');
  selections.city = searchParams.getAll('city');

  if (mode === 'random') {
    return Response.json({
      destination: getRandomTravelLocation(targetLevel, selections),
    });
  }

  return Response.json({
    options: getTravelOptions(targetLevel, selections),
  });
}
