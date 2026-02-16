# Task: gen-ll-reverse_list-3680 | Score: 100% | 2026-02-13T19:35:48.521506

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))