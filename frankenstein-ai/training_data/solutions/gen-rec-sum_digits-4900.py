# Task: gen-rec-sum_digits-4900 | Score: 100% | 2026-02-13T12:25:52.742648

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)