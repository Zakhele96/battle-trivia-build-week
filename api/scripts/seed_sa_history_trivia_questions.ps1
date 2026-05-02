$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$configPath = Join-Path $repoRoot "appsettings.json"
$npgsqlPath = Join-Path $repoRoot "bin\Debug\net8.0\Npgsql.dll"

if (-not (Test-Path $configPath)) {
  throw "Could not find appsettings.json at $configPath"
}

if (-not (Test-Path $npgsqlPath)) {
  throw "Could not find Npgsql.dll at $npgsqlPath. Build the API first."
}

Add-Type -Path $npgsqlPath

$config = Get-Content -Raw -Path $configPath | ConvertFrom-Json
$connectionString = $config.ConnectionStrings.DefaultConnection

if ([string]::IsNullOrWhiteSpace($connectionString)) {
  throw "DefaultConnection is missing from appsettings.json"
}

$questions = @(
  [pscustomobject]@{
    QuestionText = "Which South African singer made the song 'Pata Pata' famous worldwide?"
    CorrectAnswer = "Miriam Makeba"
    AcceptedAnswers = @("Miriam Makeba", "Makeba")
    Category = "South African Music History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "What nickname was South African music legend Miriam Makeba widely known by?"
    CorrectAnswer = "Mama Africa"
    AcceptedAnswers = @("Mama Africa")
    Category = "South African Music History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "Which South African trumpeter and singer recorded the international hit 'Grazing in the Grass'?"
    CorrectAnswer = "Hugh Masekela"
    AcceptedAnswers = @("Hugh Masekela", "Bra Hugh", "Hugh Ramapolo Masekela")
    Category = "South African Music History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "Which South African musician wrote and performed the anti-apartheid anthem 'Bring Him Back Home'?"
    CorrectAnswer = "Hugh Masekela"
    AcceptedAnswers = @("Hugh Masekela", "Bra Hugh", "Hugh Ramapolo Masekela")
    Category = "South African Music History"
    Difficulty = "medium"
  }
  [pscustomobject]@{
    QuestionText = "Which South African choral group collaborated with Paul Simon on the album 'Graceland'?"
    CorrectAnswer = "Ladysmith Black Mambazo"
    AcceptedAnswers = @("Ladysmith Black Mambazo")
    Category = "South African Music History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "Who founded Ladysmith Black Mambazo?"
    CorrectAnswer = "Joseph Shabalala"
    AcceptedAnswers = @("Joseph Shabalala")
    Category = "South African Music History"
    Difficulty = "medium"
  }
  [pscustomobject]@{
    QuestionText = "What South African music style, driven by pennywhistles and street dance culture, became popular in the 1950s?"
    CorrectAnswer = "Kwela"
    AcceptedAnswers = @("Kwela")
    Category = "South African Music History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "What South African genre combined Zulu vocal traditions with electric instruments and became popular in the 1960s and 1970s?"
    CorrectAnswer = "Mbaqanga"
    AcceptedAnswers = @("Mbaqanga", "uMbaqanga", "Mbhaqanga", "uMbhaqanga" )
    Category = "South African Music History"
    Difficulty = "medium"
  }
  [pscustomobject]@{
    QuestionText = "Which pianist and composer created the classic South African jazz piece 'Mannenberg'?"
    CorrectAnswer = "Abdullah Ibrahim"
    AcceptedAnswers = @("Abdullah Ibrahim", "Dollar Brand", "Adolph Johannes Brand")
    Category = "South African Music History"
    Difficulty = "medium"
  }
  [pscustomobject]@{
    QuestionText = "Before taking the name Abdullah Ibrahim, what stage name was the jazz pianist Abdullah Ibrahim widely known by?"
    CorrectAnswer = "Dollar Brand"
    AcceptedAnswers = @("Dollar Brand", "Abdullah Ibrahim")
    Category = "South African Music History"
    Difficulty = "medium"
  }
  [pscustomobject]@{
    QuestionText = "Which South African singer became famous for songs like 'Weekend Special' and 'Vulindlela'?"
    CorrectAnswer = "Brenda Fassie"
    AcceptedAnswers = @("Brenda Fassie")
    Category = "South African Music History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "Which South African artist was nicknamed the 'Queen of African Pop'?"
    CorrectAnswer = "Brenda Fassie"
    AcceptedAnswers = @("Brenda Fassie")
    Category = "South African Music History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "Which South African musician was known as the 'White Zulu'?"
    CorrectAnswer = "Johnny Clegg"
    AcceptedAnswers = @("Johnny Clegg")
    Category = "South African Music History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "Which anti-apartheid hit by Johnny Clegg and Savuka includes the line 'Asimbonanga uMandela thina'?"
    CorrectAnswer = "Asimbonanga"
    AcceptedAnswers = @("Asimbonanga")
    Category = "South African Music History"
    Difficulty = "medium"
  }
  [pscustomobject]@{
    QuestionText = "Which South African musician co-founded Juluka with Sipho Mchunu?"
    CorrectAnswer = "Johnny Clegg"
    AcceptedAnswers = @("Johnny Clegg")
    Category = "South African Music History"
    Difficulty = "medium"
  }
  [pscustomobject]@{
    QuestionText = "What township-born South African genre became a major youth sound in the 1990s after apartheid?"
    CorrectAnswer = "Kwaito"
    AcceptedAnswers = @("Kwaito")
    Category = "South African Music History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "Which South African Kwaito star released the hit 'Nkalakatha'?"
    CorrectAnswer = "Mandoza"
    AcceptedAnswers = @("Mandoza", "Mduduzi Tshabalala")
    Category = "South African Music History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "What South African genre, known for log drums and deep house influence, exploded in popularity in the late 2010s?"
    CorrectAnswer = "Amapiano"
    AcceptedAnswers = @("Amapiano")
    Category = "South African Music History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "Which South African house music pioneer is famous for the song 'Osama'?"
    CorrectAnswer = "Zakes Bantwini"
    AcceptedAnswers = @("Zakes Bantwini", "Zakhele Madida")
    Category = "South African Music History"
    Difficulty = "medium"
  }
  [pscustomobject]@{
    QuestionText = "Which South African dance music duo released the hit 'Clap Song' in the 1980s?"
    CorrectAnswer = "The Rockets"
    AcceptedAnswers = @("The Rockets", "Rockets")
    Category = "South African Music History"
    Difficulty = "hard"
  }

  [pscustomobject]@{
    QuestionText = "What is the nickname of the South African national men's football team?"
    CorrectAnswer = "Bafana Bafana"
    AcceptedAnswers = @("Bafana Bafana", "Bafana")
    Category = "South African Football History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "In which year did South Africa win the Africa Cup of Nations?"
    CorrectAnswer = "1996"
    AcceptedAnswers = @("1996")
    Category = "South African Football History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "Who coached South Africa to the 1996 Africa Cup of Nations title?"
    CorrectAnswer = "Clive Barker"
    AcceptedAnswers = @("Clive Barker")
    Category = "South African Football History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "Who captained South Africa when they won the 1996 Africa Cup of Nations?"
    CorrectAnswer = "Neil Tovey"
    AcceptedAnswers = @("Neil Tovey")
    Category = "South African Football History"
    Difficulty = "medium"
  }
  [pscustomobject]@{
    QuestionText = "Which country hosted the 2010 FIFA World Cup?"
    CorrectAnswer = "South Africa"
    AcceptedAnswers = @("South Africa", "RSA" , "South Ah")
    Category = "South African Football History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "Which South African player scored the opening goal of the 2010 FIFA World Cup?"
    CorrectAnswer = "Siphiwe Tshabalala"
    AcceptedAnswers = @("Siphiwe Tshabalala", "Tshabalala")
    Category = "South African Football History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "Which stadium in Johannesburg hosted the 2010 FIFA World Cup final?"
    CorrectAnswer = "Soccer City"
    AcceptedAnswers = @("Soccer City", "FNB Stadium", "Soccer City Stadium")
    Category = "South African Football History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "Which South African club is nicknamed the Buccaneers?"
    CorrectAnswer = "Orlando Pirates"
    AcceptedAnswers = @("Orlando Pirates", "Pirates")
    Category = "South African Football History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "Which South African club was founded by Kaizer Motaung in 1970?"
    CorrectAnswer = "Kaizer Chiefs"
    AcceptedAnswers = @("Kaizer Chiefs", "Chiefs")
    Category = "South African Football History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "Which South African club is nicknamed 'The Brazilians'?"
    CorrectAnswer = "Mamelodi Sundowns"
    AcceptedAnswers = @("Mamelodi Sundowns", "Sundowns")
    Category = "South African Football History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "Which South African club won the 1995 CAF Champions League?"
    CorrectAnswer = "Orlando Pirates"
    AcceptedAnswers = @("Orlando Pirates", "Pirates")
    Category = "South African Football History"
    Difficulty = "medium"
  }
  [pscustomobject]@{
    QuestionText = "Which South African club won the 2016 CAF Champions League?"
    CorrectAnswer = "Mamelodi Sundowns"
    AcceptedAnswers = @("Mamelodi Sundowns", "Sundowns")
    Category = "South African Football History"
    Difficulty = "medium"
  }
  [pscustomobject]@{
    QuestionText = "Which South African striker is the men's national team's all-time leading goalscorer?"
    CorrectAnswer = "Benni McCarthy"
    AcceptedAnswers = @("Benni McCarthy", "Benedict McCarthy", "Benedict Saul McCarthy")
    Category = "South African Football History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "Which South African player won the UEFA Champions League with Porto in 2004?"
    CorrectAnswer = "Benni McCarthy"
    AcceptedAnswers = @("Benni McCarthy", "Benedict McCarthy", "Benedict Saul McCarthy")
    Category = "South African Football History"
    Difficulty = "medium"
  }
  [pscustomobject]@{
    QuestionText = "Which South African defender became famous as captain of Leeds United in England?"
    CorrectAnswer = "Lucas Radebe"
    AcceptedAnswers = @("Lucas Radebe", "Radebe")
    Category = "South African Football History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "Which South African football legend is commonly known as Doctor Khumalo?"
    CorrectAnswer = "Doctor Khumalo"
    AcceptedAnswers = @("Doctor Khumalo", "Themba Khumalo", "Themba 'Doctor' Khumalo")
    Category = "South African Football History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "In which year did South Africa make their first FIFA World Cup appearance?"
    CorrectAnswer = "1998"
    AcceptedAnswers = @("1998")
    Category = "South African Football History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "Which country beat South Africa 3-0 in Bafana Bafana's opening match at the 1998 FIFA World Cup?"
    CorrectAnswer = "France"
    AcceptedAnswers = @("France")
    Category = "South African Football History"
    Difficulty = "medium"
  }
  [pscustomobject]@{
    QuestionText = "Which South African striker scored against Denmark at the 1998 FIFA World Cup?"
    CorrectAnswer = "Benni McCarthy"
    AcceptedAnswers = @("Benni McCarthy", "Benedict McCarthy", "Benedict Saul McCarthy")
    Category = "South African Football History"
    Difficulty = "hard"
  }
  [pscustomobject]@{
    QuestionText = "Which country did South Africa beat 2-1 in their final group match at the 2010 FIFA World Cup?"
    CorrectAnswer = "France"
    AcceptedAnswers = @("France")
    Category = "South African Football History"
    Difficulty = "easy"
  }
  [pscustomobject]@{
    QuestionText = "Which country beat South Africa in the 1998 Africa Cup of Nations final?"
    CorrectAnswer = "Egypt"
    AcceptedAnswers = @("Egypt")
    Category = "South African Football History"
    Difficulty = "medium"
  }
)

$connection = [Npgsql.NpgsqlConnection]::new($connectionString)
$connection.Open()
$transaction = $connection.BeginTransaction()

try {
  $inserted = 0

  foreach ($question in $questions) {
    $command = $connection.CreateCommand()
    $command.Transaction = $transaction
    $command.CommandText = @"
INSERT INTO trivia_questions (
  id,
  question_text,
  correct_answer,
  accepted_answers,
  category,
  difficulty,
  is_active,
  created_at
)
SELECT
  @Id,
  @QuestionText,
  @CorrectAnswer,
  CAST(@AcceptedAnswersJson AS jsonb),
  @Category,
  @Difficulty,
  TRUE,
  @CreatedAt
WHERE NOT EXISTS (
  SELECT 1
  FROM trivia_questions
  WHERE question_text = @QuestionText
);
"@

    [void]$command.Parameters.AddWithValue("Id", [guid]::NewGuid())
    [void]$command.Parameters.AddWithValue("QuestionText", $question.QuestionText)
    [void]$command.Parameters.AddWithValue("CorrectAnswer", $question.CorrectAnswer)
    [void]$command.Parameters.AddWithValue("AcceptedAnswersJson", [System.Text.Json.JsonSerializer]::Serialize($question.AcceptedAnswers))
    [void]$command.Parameters.AddWithValue("Category", $question.Category)
    [void]$command.Parameters.AddWithValue("Difficulty", $question.Difficulty)
    [void]$command.Parameters.AddWithValue("CreatedAt", [datetime]::UtcNow)

    $inserted += $command.ExecuteNonQuery()
  }

  $countCommand = $connection.CreateCommand()
  $countCommand.Transaction = $transaction
  $countCommand.CommandText = @"
SELECT
  category,
  COUNT(*)::int AS total
FROM trivia_questions
WHERE category IN ('South African Music History', 'South African Football History')
GROUP BY category
ORDER BY category;
"@

  $reader = $countCommand.ExecuteReader()
  $rows = @()
  while ($reader.Read()) {
    $rows += [pscustomobject]@{
      Category = $reader.GetString(0)
      Total = $reader.GetInt32(1)
    }
  }
  $reader.Close()

  $transaction.Commit()

  Write-Output "Inserted rows this run: $inserted"
  $rows | Format-Table -AutoSize
}
catch {
  try {
    $transaction.Rollback()
  }
  catch {
  }
  throw
}
finally {
  $connection.Dispose()
}
