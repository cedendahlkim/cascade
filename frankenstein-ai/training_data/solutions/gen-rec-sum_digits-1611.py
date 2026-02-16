# Task: gen-rec-sum_digits-1611 | Score: 100% | 2026-02-12T19:28:15.450780

def recursive_digit_sum(n):
  """Calculates the recursive digit sum of a positive integer."""
  s = str(n)
  if len(s) == 1:
    return int(s)
  else:
    sum_digits = sum(int(digit) for digit in s)
    return recursive_digit_sum(sum_digits)

if __name__ == "__main__":
  n = int(input())
  result = recursive_digit_sum(n)
  print(result)