# Task: gen-rec-sum_digits-6422 | Score: 100% | 2026-02-13T09:43:32.139975

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)