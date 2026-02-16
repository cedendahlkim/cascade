# Task: gen-rec-sum_digits-3053 | Score: 100% | 2026-02-15T12:30:00.910919

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)