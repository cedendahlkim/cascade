# Task: gen-rec-sum_digits-9152 | Score: 100% | 2026-02-12T17:11:03.131301

def recursive_digit_sum(n):
  """Calculates the recursive digit sum of a positive integer.

  Args:
    n: A positive integer.

  Returns:
    The recursive digit sum of n.
  """
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