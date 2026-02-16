# Task: gen-rec-sum_digits-7392 | Score: 100% | 2026-02-12T12:19:41.219238

def recursive_digit_sum(n):
  if n < 10:
    return n
  else:
    s = 0
    while n > 0:
      s += n % 10
      n //= 10
    return recursive_digit_sum(s)

n = int(input())
print(recursive_digit_sum(n))