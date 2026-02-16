# Task: gen-numtheory-digit_sum-5780 | Score: 100% | 2026-02-15T10:09:39.943357

n = int(input())
print(sum(int(d) for d in str(abs(n))))