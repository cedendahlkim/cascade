# Task: gen-rec-sum_digits-3548 | Score: 100% | 2026-02-15T10:29:12.551624

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)