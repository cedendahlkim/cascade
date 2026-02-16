# Task: gen-rec-sum_digits-2347 | Score: 100% | 2026-02-12T17:10:47.029710

def recursive_digit_sum(n):
  n_str = str(n)
  if len(n_str) == 1:
    return int(n_str)
  else:
    sum_digits = sum(int(digit) for digit in n_str)
    return recursive_digit_sum(sum_digits)

n = int(input())
print(recursive_digit_sum(n))