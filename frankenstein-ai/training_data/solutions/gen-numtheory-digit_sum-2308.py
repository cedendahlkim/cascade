# Task: gen-numtheory-digit_sum-2308 | Score: 100% | 2026-02-15T12:03:45.923679

n = int(input())
print(sum(int(d) for d in str(abs(n))))