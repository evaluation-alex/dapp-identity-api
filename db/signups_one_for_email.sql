SELECT
  id,
  email
FROM
  signups
WHERE
  email = ${email}
AND
  created_at > now() - interval ${interval}
