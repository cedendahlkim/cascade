# Task: gen-rec-sum_digits-2232 | Score: 100% | 2026-02-10T15:42:41.284384

def recursive_digit_sum(n):
  s = str(n)
  if len(s) == 1:
    return int(s)
  else:
    digit_sum = sum(int(digit) for digit in s)
    return recursive_digit_sum(digit_sum)

n = int(input())
print(recursive_digit_sum(n))