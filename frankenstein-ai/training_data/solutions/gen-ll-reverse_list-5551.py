# Task: gen-ll-reverse_list-5551 | Score: 100% | 2026-02-13T19:48:46.132659

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))