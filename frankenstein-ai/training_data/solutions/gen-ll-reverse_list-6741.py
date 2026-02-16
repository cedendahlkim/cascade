# Task: gen-ll-reverse_list-6741 | Score: 100% | 2026-02-13T13:53:46.366847

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))