# Task: gen-rec-sum_digits-2208 | Score: 100% | 2026-02-12T12:25:23.903633

def recursive_digit_sum(n):
  """Calculates the recursive digit sum of a positive integer."""
  s = str(n)
  if len(s) == 1:
    return int(s)
  else:
    digit_sum = sum(int(digit) for digit in s)
    return recursive_digit_sum(digit_sum)

if __name__ == "__main__":
  n = int(input())
  result = recursive_digit_sum(n)
  print(result)