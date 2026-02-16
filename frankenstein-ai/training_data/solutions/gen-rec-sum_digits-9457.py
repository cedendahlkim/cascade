# Task: gen-rec-sum_digits-9457 | Score: 100% | 2026-02-13T20:01:40.296551

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)