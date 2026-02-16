# Task: gen-ll-remove_nth-6704 | Score: 100% | 2026-02-13T20:33:26.253599

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))