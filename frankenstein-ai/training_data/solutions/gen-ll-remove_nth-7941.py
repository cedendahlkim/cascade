# Task: gen-ll-remove_nth-7941 | Score: 100% | 2026-02-15T11:13:18.696244

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))