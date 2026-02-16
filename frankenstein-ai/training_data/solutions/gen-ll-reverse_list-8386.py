# Task: gen-ll-reverse_list-8386 | Score: 100% | 2026-02-13T18:29:59.752690

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))