# Task: gen-ll-remove_nth-8700 | Score: 100% | 2026-02-13T19:47:44.459693

n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))