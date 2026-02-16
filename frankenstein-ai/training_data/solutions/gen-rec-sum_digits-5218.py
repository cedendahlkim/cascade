# Task: gen-rec-sum_digits-5218 | Score: 100% | 2026-02-10T15:42:03.954950

def recursive_digit_sum(n):
  n_str = str(n)
  if len(n_str) == 1:
    return int(n_str)
  else:
    digit_sum = 0
    for digit in n_str:
      digit_sum += int(digit)
    return recursive_digit_sum(digit_sum)

n = int(input())
result = recursive_digit_sum(n)
print(result)