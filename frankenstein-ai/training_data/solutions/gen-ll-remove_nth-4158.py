# Task: gen-ll-remove_nth-4158 | Score: 100% | 2026-02-15T10:08:53.019088

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))