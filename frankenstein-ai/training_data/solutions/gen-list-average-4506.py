# Task: gen-list-average-4506 | Score: 100% | 2026-02-13T12:25:56.342062

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))