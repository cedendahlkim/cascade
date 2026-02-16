# Task: gen-numtheory-digit_sum-4323 | Score: 100% | 2026-02-15T08:14:56.244283

n = int(input())
print(sum(int(d) for d in str(abs(n))))