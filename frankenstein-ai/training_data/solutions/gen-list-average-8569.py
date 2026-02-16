# Task: gen-list-average-8569 | Score: 100% | 2026-02-13T20:50:38.441979

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))