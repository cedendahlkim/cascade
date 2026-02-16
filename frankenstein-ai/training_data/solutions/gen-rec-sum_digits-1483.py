# Task: gen-rec-sum_digits-1483 | Score: 100% | 2026-02-13T12:13:21.831224

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)