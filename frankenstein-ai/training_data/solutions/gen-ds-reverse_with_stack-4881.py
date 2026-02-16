# Task: gen-ds-reverse_with_stack-4881 | Score: 100% | 2026-02-13T13:42:23.623633

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))