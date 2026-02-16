# Task: gen-numtheory-digit_sum-4699 | Score: 100% | 2026-02-15T09:51:27.613876

n = int(input())
print(sum(int(d) for d in str(abs(n))))