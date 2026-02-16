# Task: gen-ds-reverse_with_stack-6617 | Score: 100% | 2026-02-14T12:36:42.057941

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))