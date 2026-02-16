# Task: gen-rec-sum_digits-4355 | Score: 100% | 2026-02-13T10:03:00.401957

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)