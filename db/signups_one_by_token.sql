SELECT
  id,
  email
FROM
  signups
WHERE
  id = ${token}
AND
  created_at > now() - interval ${interval}
