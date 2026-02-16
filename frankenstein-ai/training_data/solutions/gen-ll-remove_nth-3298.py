# Task: gen-ll-remove_nth-3298 | Score: 100% | 2026-02-13T15:28:35.165906

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))