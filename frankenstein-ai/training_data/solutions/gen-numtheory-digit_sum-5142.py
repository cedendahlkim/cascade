# Task: gen-numtheory-digit_sum-5142 | Score: 100% | 2026-02-13T12:04:14.122129

n = int(input())
print(sum(int(d) for d in str(abs(n))))