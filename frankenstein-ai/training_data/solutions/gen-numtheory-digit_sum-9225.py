# Task: gen-numtheory-digit_sum-9225 | Score: 100% | 2026-02-13T11:53:58.742894

n = int(input())
print(sum(int(d) for d in str(abs(n))))