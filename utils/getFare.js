const getDistanceTime = require('./getDistanceTime');

const getFare =  async(pickup, destination) => {
  if (!pickup || !destination) {
    throw new Error('Both pickup and destination are required');
  }

  const distanceTime = await getDistanceTime(pickup, destination);

  const baseFare = {
    auto: 30,
    car: 50,
    bike: 20
  };

  const perKmRate = {
    auto: 10,
    car: 15,
    bike: 8
  };

  const perMinuteRate = {
    auto: 2,
    car: 3,
    bike: 1.5
  };

  const fare = {
    auto: Math.round(
      baseFare.auto +
      (distanceTime.distance.value / 1000) * perKmRate.auto +
      (distanceTime.duration.value / 60) * perMinuteRate.auto
    ),
    car: Math.round(
      baseFare.car +
      (distanceTime.distance.value / 1000) * perKmRate.car +
      (distanceTime.duration.value / 60) * perMinuteRate.car
    ),
    bike: Math.round(
      baseFare.bike +
      (distanceTime.distance.value / 1000) * perKmRate.bike +
      (distanceTime.duration.value / 60) * perMinuteRate.bike
    )
  };

  return fare;
}

module.exports = getFare;