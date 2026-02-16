# Task: gen-rec-sum_digits-8659 | Score: 100% | 2026-02-13T12:30:40.035921

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)