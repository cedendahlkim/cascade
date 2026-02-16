# Task: gen-ll-remove_nth-7113 | Score: 100% | 2026-02-13T18:38:27.769802

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))