# Task: gen-ll-remove_nth-6337 | Score: 100% | 2026-02-13T18:45:24.786896

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))