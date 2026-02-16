# Task: gen-rec-sum_digits-5937 | Score: 100% | 2026-02-13T21:48:44.112198

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)