# Task: gen-rec-sum_digits-1424 | Score: 100% | 2026-02-12T20:29:19.403273

def recursive_digit_sum(n):
  n_str = str(n)
  if len(n_str) == 1:
    return int(n_str)
  else:
    digit_sum = sum(int(digit) for digit in n_str)
    return recursive_digit_sum(digit_sum)

n = int(input())
print(recursive_digit_sum(n))